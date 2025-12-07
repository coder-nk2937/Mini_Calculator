/* app.js — simple, safe client-side expression handling */
(() => {
  const screen = document.getElementById('screen');
  const buttons = Array.from(document.querySelectorAll('.btn'));
  let expr = ''; // internal expression string

  // helpers
  function updateScreen(value) {
    screen.value = value;
  }

  function safeAppend(token) {
    // prevent two operators in a row (except minus and parentheses)
    if (expr === '' && /[+\/*.]/.test(token)) return;
    expr += token;
    updateScreen(expr || '0');
  }

  function clearAll() {
    expr = '';
    updateScreen('0');
  }

  function toggleSign() {
    // try simple toggle: wrap with (0-... ) or remove wrapper if present
    if (!expr) return;
    if (/^\(0-.*\)$/.test(expr)) {
      expr = expr.replace(/^\(0-(.*)\)$/, '$1');
    } else {
      expr = `(0-${expr})`;
    }
    updateScreen(expr);
  }

  function percent() {
    // convert last number to percentage (e.g., 50 -> (50/100))
    expr = expr.replace(/(\d+(\.\d+)?)$/, '($1/100)');
    updateScreen(expr);
  }

  function addSqrt() {
    // append Math.sqrt( — keep expression user friendly as √(
    expr += 'Math.sqrt(';
    updateScreen(expr);
  }

  function sanitizeForEval(input) {
    // allow digits, basic math symbols, parentheses, decimal, Math.sqrt
    // reject anything else
    const allowed = /^[0-9+\-*/().%Mathsqrt]+$/;
    // we allow the string 'Math.sqrt' and parentheses. Percent signs are handled earlier.
    // As an extra guard, ensure 'Math' only appears as 'Math.sqrt('
    if (!allowed.test(input)) return null;
    if (/Math(?!\.sqrt\()/.test(input)) return null;
    return input;
  }

  function evaluateExpression() {
    if (!expr) return;
    // close any unclosed parentheses (basic attempt)
    const open = (expr.match(/\(/g) || []).length;
    const close = (expr.match(/\)/g) || []).length;
    if (open > close) expr = expr + ')'.repeat(open - close);

    // Replace any % left (should be handled earlier)
    expr = expr.replace(/%/g, '/100');

    // sanitize expression: we allow numbers, operators, parentheses and Math.sqrt only
    const safe = sanitizeForEval(expr);
    if (!safe) {
      updateScreen('ERROR');
      expr = '';
      return;
    }

    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${safe});`)();
      if (result === Infinity || Number.isNaN(result)) throw new Error('bad');
      updateScreen(String(Number.isInteger(result) ? result : Number(result.toFixed(10)).toString()));
      expr = String(result);
    } catch (e) {
      updateScreen('ERROR');
      expr = '';
    }
  }

  // attach handlers
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.value;
      const action = btn.dataset.action;

      if (action === 'clear') return clearAll();
      if (action === 'toggle-sign') return toggleSign();
      if (action === 'percent') return percent();
      if (action === 'sqrt') return addSqrt();
      if (action === 'equals') return evaluateExpression();

      if (val) {
        // translate display operators to JS-friendly forms
        const mapping = { '÷': '/', '×': '*', '−': '-' };
        const token = mapping[val] || val;
        safeAppend(token);
      }
    });
  });

  // keyboard support (basic)
  window.addEventListener('keydown', (ev) => {
    const key = ev.key;
    if (key === 'Enter') { ev.preventDefault(); evaluateExpression(); return; }
    if (key === 'Backspace') { ev.preventDefault(); expr = expr.slice(0, -1); updateScreen(expr || '0'); return; }
    if (key === 'Escape') { clearAll(); return; }
    if (/^[0-9+\-*/().]$/.test(key)) {
      safeAppend(key);
    } else if (key === '%') percent();
    else if (key === 's') addSqrt(); // press 's' to insert sqrt (optional)
  });

  // start
  clearAll();
})();
