# Security Policy

## 🔒 Security Overview

OpenVJ is a client-side web application that runs entirely in your browser. We take security seriously and have implemented several measures to protect user data and privacy.

## 🛡️ Security Features

### Data Storage

- **Local Storage Only** – All project data, API keys, and settings are stored in your browser's localStorage
- **No Server Communication** – OpenVJ does not transmit your projects or settings to any remote server
- **API Keys** – If you use AI shader generation, your Anthropic API key is stored locally and only sent directly to Anthropic's API (not through our servers)

### Third-Party Services

OpenVJ may communicate with external services only when explicitly enabled by the user:

| Service | Purpose | When Used | Data Sent |
|---------|---------|-----------|-----------|
| Anthropic Claude API | AI shader generation | When you use the "Generate with AI" feature | Your prompt text + API key (in headers) |

**We do not collect, store, or transmit:**
- Your video files
- Your project configurations
- Your shader code
- Your personal information
- Usage analytics (optional in future versions, always opt-in)

### Browser Permissions

OpenVJ requests only the minimum necessary browser permissions:

- **File Access** – To load video files you explicitly select
- **localStorage** – To save your projects and settings
- **WebGL** – For 3D rendering
- **Media (future)** – For webcam input (only when you enable this feature)

## 🚨 Reporting a Vulnerability

We appreciate responsible disclosure of security vulnerabilities.

### How to Report

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead:

1. **Email:** Send details to security@example.com (replace with actual email)
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)
3. **Response Time:** We will respond within 48 hours

### What to Expect

- **Acknowledgment** within 48 hours
- **Initial assessment** within 5 business days
- **Fix timeline** provided based on severity
- **Credit** in release notes (if desired)

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| **Critical** | Remote code execution, data breach | 24 hours |
| **High** | Authentication bypass, XSS | 3 days |
| **Medium** | CSRF, information disclosure | 1 week |
| **Low** | Minor security improvements | 2 weeks |

## 🔐 Security Best Practices for Users

### API Keys

If you use the AI shader generation feature:

- ✅ **DO** store API keys in environment variables for production deployments
- ✅ **DO** use API keys with minimal permissions
- ✅ **DO** rotate API keys regularly
- ❌ **DON'T** share API keys publicly
- ❌ **DON'T** commit API keys to git repositories

### Self-Hosting

If you self-host OpenVJ:

- ✅ **DO** serve over HTTPS in production
- ✅ **DO** keep dependencies updated
- ✅ **DO** use a reverse proxy (nginx, Caddy) for production
- ❌ **DON'T** expose development servers to the public internet

### Content Security

When loading external media files:

- ✅ **DO** only load media from trusted sources
- ✅ **DO** scan files for viruses if from untrusted sources
- ⚠️ **BE AWARE** that malformed media files could potentially trigger browser bugs

## 🔍 Security Audits

### Internal Security Checks

Before each release, we:
- Run automated security scanners (npm audit)
- Review dependency vulnerabilities
- Test for common web vulnerabilities (XSS, CSRF, etc.)
- Verify that no sensitive data is exposed

### Current Status (v0.1.0)

✅ No hardcoded API keys or secrets
✅ No sensitive paths in code
✅ Dependencies scanned for vulnerabilities
✅ .gitignore properly configured
✅ No external data transmission (except user-initiated API calls)

### Known Limitations

- **No Authentication** – OpenVJ is a client-side tool; implement authentication if deploying publicly
- **localStorage Limits** – Projects stored in localStorage are not encrypted
- **CORS Restrictions** – Some external media may be blocked by CORS policies

## 🛠️ Security Tools Used

- **npm audit** – Dependency vulnerability scanning
- **ESLint** – Static code analysis
- **TypeScript** – Type safety
- **Vite** – Secure build process with tree-shaking

## 📜 Dependencies

We strive to:
- Keep dependencies up-to-date
- Minimize dependency count
- Audit dependencies regularly
- Respond quickly to security advisories

Check `npm audit` output for current status.

## 🔄 Security Updates

Security fixes will be released as patch versions (e.g., 0.1.1) and communicated via:

- **GitHub Security Advisories**
- **Release notes**
- **CHANGELOG.md**

## 💬 Questions?

For security-related questions (not vulnerabilities):
- Open a [GitHub Discussion](https://github.com/yourusername/openvj/discussions)
- Tag with `security` label

For actual vulnerabilities, use the reporting process above.

---

**Last Updated:** April 12, 2026
**Version:** 0.1.0-beta
