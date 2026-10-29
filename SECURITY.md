# Security Policy

## Security Model & Privacy Guarantee

FileFixer is designed with an on-device, local-first security architecture:

1. **Zero Server Uploads**: Files uploaded to FileFixer are processed strictly in local browser memory via JavaScript, Web Workers, and the HTML5 Canvas API. Files are never transmitted to any external server or cloud processing backend.
2. **No Data Storage on Remote Servers**: File contents, filenames, and processed results remain on your physical device. When you close the browser tab or clear the session, memory is reclaimed.
3. **No External Analytics or Trackers**: FileFixer contains no tracking scripts, advertising SDKs, or session replay tools that could capture sensitive file data.
4. **Client-Side History**: Any processing logs or bandwidth metrics stored for your convenience reside solely in your browser's local `IndexedDB` and `localStorage`.

---

## Reporting a Security Vulnerability

If you discover a security vulnerability or a privacy violation in FileFixer (such as accidental network egress, an unhandled data leakage vector, or a client-side execution vulnerability), please report it responsibly:

### How to Report

- **Preferred Method**: Use **[GitHub Private Vulnerability Reporting](https://github.com/manishmeena513/FileFixer/security/advisories/new)** to submit a private security advisory. This allows maintainers to collaborate with you securely without exposing the issue publicly before a fix is deployed.
- **Alternative Method**: If Private Vulnerability Reporting is unavailable, you may open an issue on GitHub requesting a private communication channel with maintainers. **Please do not post reproducible exploit scripts or confidential vulnerability details in public issues or pull requests.**

### What to Include

When reporting a vulnerability, please provide:
- A description of the issue and its potential impact.
- Clear steps or a proof-of-concept demonstrating how the vulnerability can be reproduced.
- The browser and operating system version used during testing.
- Any suggested fixes or remediations if known.

We appreciate the efforts of security researchers and open-source contributors in keeping FileFixer safe and private for everyone.
