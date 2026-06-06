# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | ✅ |

## Reporting a Vulnerability

If you discover a security vulnerability, please **DO NOT** open a public issue.

Instead, please report it via:

1. **Email**: [your-email]
2. **GitHub Security Advisories**: Use the "Report a vulnerability" button on the Security tab

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: within 48 hours
- **Initial assessment**: within 1 week
- **Fix deployment**: depends on severity (critical: 24-48h, high: 1 week, medium: 2 weeks)

## Security Measures

- All passwords are hashed with bcrypt (cost factor 12)
- Session tokens are httpOnly, secure, sameSite cookies
- JWT tokens expire after 7 days
- Rate limiting on all auth endpoints
- Email verification required for registration
- Verification codes limited to 5 attempts
- Input validation on all API endpoints
- SQL injection prevention via Prisma ORM
- XSS prevention via React's default escaping
