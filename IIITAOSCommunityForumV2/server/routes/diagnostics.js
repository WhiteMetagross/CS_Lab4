const express = require('express');
const router = express.Router();
const { execFile } = require('child_process');
const { verifyCsrf } = require('./auth');

//Defense: Avoid the shell using execFile with argument vector, strict IP or hostname allow listing, and safe error responses.
router.post('/ping', (req, res) => {
  const host = (req.body.host || '').trim();

  //Defense: Strict allow list validation for hostname or IPv4 address.
  const hostPattern = /^(localhost|([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}|(\d{1,3}\.){3}\d{1,3})$/;

  if (!host || !hostPattern.test(host)) {
    return res.status(400).json({
      error: 'Command Injection Defense: Input rejected. Host parameter must strictly match a valid IP address or domain hostname without command separators or shell metacharacters.'
    });
  }

  //Defense: Avoid shell by passing arguments strictly as an array vector to execFile without a shell.
  const pingExecutable = 'ping';
  const pingArguments = process.platform === 'win32' ? ['-n', '2', host] : ['-c', '2', host];

  execFile(pingExecutable, pingArguments, { shell: false, timeout: 5000 }, (error, stdout, stderr) => {
    if (error && !stdout) {
      return res.status(500).json({
        output: 'Diagnostic ping failed: ' + (stderr || error.message)
      });
    }

    return res.json({
      command: pingExecutable + ' ' + pingArguments.join(' '),
      output: stdout || stderr || 'Ping completed successfully.'
    });
  });
});

//Defense: Strict target allow list and parameterized execution without shell chaining.
router.post('/archive', (req, res) => {
  const target = (req.body.target || '').trim();

  //Defense: Allow list validation matching predefined diagnostics targets.
  const allowedTargets = ['telemetry', 'logs', 'database_snapshot', 'mirror_sync', 'build_worker'];

  if (!allowedTargets.includes(target)) {
    return res.status(400).json({
      error: 'Command Injection Defense: Target rejected. Target must be chosen from the approved allow list: ' + allowedTargets.join(', ') + '.'
    });
  }

  return res.json({
    status: 'Diagnostics archive task scheduled successfully for target: ' + target + '.'
  });
});

module.exports = router;
