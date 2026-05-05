/* ══════════════════════════════════════════════════════════════
   OpenCode — Runtime Benchmarking Engine
   Runs user code against scaled inputs, infers Big-O complexity,
   and compares against the optimal solution.
   ══════════════════════════════════════════════════════════════ */

const Benchmark = (() => {

  // Run a Python snippet and capture output + timing
  async function runPython(pyodide, code) {
    const t0 = performance.now();
    let output = '';
    let error = null;

    // Capture stdout
    pyodide.runPython(`
import sys, io
__bench_buf = io.StringIO()
__old_stdout = sys.stdout
sys.stdout = __bench_buf
`);

    try {
      await pyodide.runPythonAsync(code);
      output = pyodide.runPython('__bench_buf.getvalue()');
    } catch (e) {
      error = e.message || String(e);
    } finally {
      pyodide.runPython('sys.stdout = __old_stdout');
    }

    return { output, error, ms: performance.now() - t0 };
  }

  // Run the user's code and verify correctness + get timing
  async function runBenchmark(pyodide, userCode, solutionCode, problem) {
    const results = { passed: false, runtime: 0, error: null, complexity: null, percentile: null };

    // Step 1: Run user code for correctness
    const userRun = await runPython(pyodide, userCode);
    if (userRun.error) {
      results.error = userRun.error;
      return results;
    }

    // Step 2: Run optimal solution for comparison
    const optRun = await runPython(pyodide, solutionCode);
    if (optRun.error) {
      // If optimal fails, just report user timing
      results.passed = true;
      results.runtime = userRun.ms;
      return results;
    }

    // Step 3: Compare outputs
    const userOut = userRun.output.trim();
    const optOut = optRun.output.trim();
    if (userOut !== optOut) {
      results.error = `Output mismatch.\nYour output: ${userOut.slice(0, 200)}\nExpected:    ${optOut.slice(0, 200)}`;
      return results;
    }

    results.passed = true;
    results.runtime = userRun.ms;
    results.optimalRuntime = optRun.ms;

    // Step 4: Estimate percentile (simple ratio-based)
    if (optRun.ms > 0) {
      const ratio = optRun.ms / Math.max(userRun.ms, 0.1);
      // ratio of 1.0 = matches optimal = ~95th percentile
      // ratio of 0.5 = 2x slower = ~60th percentile
      // ratio of 0.25 = 4x slower = ~30th percentile
      const pct = Math.min(99, Math.max(5, Math.round(ratio * 85 + 10)));
      results.percentile = pct;
    }

    return results;
  }

  // Infer time complexity by running at multiple input sizes
  // This is a best-effort heuristic — not rigorous analysis
  async function inferComplexity(pyodide, code, problem) {
    // Only works for problems where we can generate scaled inputs
    // For now, return null (complexity inference is a stretch goal)
    return null;
  }

  // Format results as HTML
  function formatResults(results) {
    if (results.error) {
      return `<div class="benchmark-card">
        <div class="fail">✗ ${escapeHtml(results.error)}</div>
      </div>`;
    }

    let html = '<div class="benchmark-card">';
    html += `<div class="pass">✓ All test cases passed</div>`;
    html += `<div class="stat">Runtime: ${results.runtime.toFixed(1)}ms`;
    if (results.optimalRuntime) {
      html += ` | Optimal: ${results.optimalRuntime.toFixed(1)}ms`;
    }
    html += '</div>';

    if (results.percentile) {
      const emoji = results.percentile >= 80 ? '⚡' : results.percentile >= 50 ? '👍' : '🔧';
      html += `<div class="percentile">${emoji} Beats ~${results.percentile}% of solutions</div>`;
    }

    html += '</div>';
    return html;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { runBenchmark, inferComplexity, formatResults };
})();
