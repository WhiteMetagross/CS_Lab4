const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

//This does execute in band command injection via shell concatenation.
router.post('/ping', (req, res) => {
  const host = req.body.host || '127.0.0.1';
  const command = process.platform === 'win32' ? 'ping -n 2 ' + host : 'ping -c 2 ' + host;

  exec(command, (error, stdout, stderr) => {
    return res.json({
      command,
      output: stdout || stderr || error?.message || 'Command executed without output.'
    });
  });
});

//This does execute blind command injection with time delay via shell concatenation.
router.post('/archive', (req, res) => {
  const target = req.body.target || 'telemetry';
  const command = process.platform === 'win32' ? 'echo archiver ' + target : 'echo archiver ' + target;

  exec(command, (error) => {
    if (error) {
      return res.status(500).json({ status: 'Diagnostics archive failed: ' + error.message });
    }
    return res.json({ status: 'Diagnostics archive task scheduled successfully.' });
  });
});

module.exports = router;
