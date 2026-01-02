# Security Analysis Report: Neural Summary

**Date**: December 20, 2025
**Scope**: Full application security audit using OWASP Top 10 as framework
**Application**: Neural Summary (Voice-to-output creation platform)

---

## Executive Summary

This security analysis covers the Neural Summary monorepo application. The codebase demonstrates **generally good security practices** with Firebase Auth, proper error sanitization, and security headers. However, several **critical and high-severity vulnerabilities** require immediate attention.

### Risk Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 2 | Requires immediate action |
| 🟠 High | 4 | Requires prompt remediation |
| 🟡 Medium | 6 | Should be addressed soon |
| 🟢 Low | 4 | Minor improvements |

---

## OWASP Top 10 Analysis

### A01:2021 – Broken Access Control

**Rating: 🟡 MEDIUM RISK**

#### Findings:

1. **Profile Photos Accessible by All Authenticated Users**
   - **File**: `firebase/storage.rules:36`
   - **Issue**: Any authenticated user can read any other user's profile photo
   ```javascript
   allow read: if isAuthenticated();  // Should be isOwner(userId)
   ```
   - **Risk**: Privacy violation, potential for scraping user images

2. **Admin Bypass Pattern**
   - **File**: `apps/api/src/guards/subscription.guard.ts:34-41`
   - **Issue**: Admins completely bypass quota checks
   - **Risk**: If admin account compromised, unlimited resource abuse

3. **Positive**: User data isolation properly enforced at Firestore query level with `userId` field filtering

---

### A02:2021 – Cryptographic Failures

**Rating: 🔴 CRITICAL RISK**

#### Findings:

1. **🔴 CRITICAL: Share Link Passwords Stored in Plaintext**
   - **File**: `apps/api/src/transcription/transcription.service.ts:1704`
   ```typescript
   if (settings.password && settings.password !== password) {
     throw new UnauthorizedException('Invalid password');
   }
   ```
   - **Impact**: Database compromise exposes all share passwords
   - **Fix**: Hash with bcrypt (12+ rounds) before storage

2. **🟠 HIGH: Signed URLs Expire After 7 Days**
   - **File**: `apps/api/src/firebase/firebase.service.ts:275`
   ```typescript
   expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
   ```
   - **Documentation states**: 5-hour expiration required
   - **Fix**: Reduce to `5 * 60 * 60 * 1000` (5 hours)

3. **Positive**: Email verification codes properly hashed with bcrypt (12 rounds) and use constant-time comparison

---

### A03:2021 – Injection

**Rating: 🟠 HIGH RISK**

#### Findings:

1. **🟠 HIGH: Path Traversal via File Upload**
   - **File**: `apps/api/src/transcription/transcription.service.ts:231`
   ```typescript
   const tempPath = path.join(tempDir, `${i}_${file.originalname}`);
   ```
   - **Attack**: Filename like `../../../etc/passwd.wav` escapes temp directory
   - **Fix**: Use `path.basename()` to extract only filename

2. **🟡 MEDIUM: FFmpeg Path Sanitization Gap**
   - **File**: `apps/api/src/utils/audio-splitter.ts:59-62`
   - **Issue**: Paths outside `/tmp` allowed with only a warning
   - **Fix**: Enforce strict `/tmp` directory restriction

3. **Positive**: No `eval()` or `new Function()` usage found
4. **Positive**: Firestore queries use parameterized values

---

### A04:2021 – Insecure Design

**Rating: 🟡 MEDIUM RISK**

#### Findings:

1. **🟡 MEDIUM: Predictable Temp File Names**
   - **Files**: `transcription.service.ts:237,540`
   ```typescript
   const mergedFileName = `merged_${Date.now()}.mp3`;
   ```
   - **Risk**: Race condition attacks possible
   - **Fix**: Use `crypto.randomBytes(16).toString('hex')`

2. **🟡 MEDIUM: Share Token Length**
   - Token uses `nanoid(10)` - while reasonable, 16 characters would be more secure
   - Rate limiting of 30/minute helps but enumeration still feasible over time

3. **Positive**: Good separation of concerns with guards, filters, and services

---

### A05:2021 – Security Misconfiguration

**Rating: 🟢 LOW RISK**

#### Findings:

1. **✅ CORS Properly Configured**
   - Whitelist-based approach (not wildcard)
   - Development origins only in non-production

2. **✅ Security Headers via Helmet**
   - HSTS enabled (1 year, preload)
   - CSP configured
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection enabled

3. **🟢 Minor: `unsafe-inline` in CSP for styles**
   - Required for Tailwind but increases XSS surface slightly

4. **🟡 MEDIUM: WebSocket CORS Fallback**
   - **File**: `apps/api/src/websocket/websocket.gateway.ts:26`
   - If `FRONTEND_URL` not set in production, could default to undefined

---

### A06:2021 – Vulnerable and Outdated Components

**Rating: 🟢 LOW RISK**

#### Findings:

1. **Dependencies appear current**:
   - Firebase Admin SDK: 13.6.0
   - Firebase Client: 12.6.0
   - NestJS: Current version

2. **Recommendation**: Run `npm audit` regularly and monitor for CVEs

---

### A07:2021 – Identification and Authentication Failures

**Rating: 🟢 LOW RISK**

#### Findings:

1. **✅ Strong Authentication**:
   - Firebase Auth with email verification enforcement
   - JWT token verification on all protected endpoints
   - Email verification codes expire in 15 minutes

2. **✅ Rate Limiting on Auth Endpoints**:
   - Signup: 3 req/60s
   - Verify email: 5 req/5min
   - Resend verification: 3 req/10min

3. **🟢 Minor: Password Policy Mismatch**
   - Frontend enforces 8 chars, Firebase allows 6 chars

---

### A08:2021 – Software and Data Integrity Failures

**Rating: 🟡 MEDIUM RISK**

#### Findings:

1. **✅ Stripe Webhook Verification**
   - Signature verification before processing
   - Raw body preserved for verification

2. **🟡 MEDIUM: No Input Length Validation on AI Prompts**
   - **File**: `transcription.service.ts:703-713`
   - User-provided context/instructions passed to OpenAI without length limits
   - **Risk**: DoS via expensive API calls, quota exhaustion

---

### A09:2021 – Security Logging and Monitoring Failures

**Rating: 🟡 MEDIUM RISK**

#### Findings:

1. **✅ Error Sanitization in Production**
   - **File**: `apps/api/src/common/filters/http-exception.filter.ts`
   - Removes file paths, IPs, API keys, emails from error messages

2. **🟡 MEDIUM: Stack Traces in Webhook Errors**
   - **File**: `apps/api/src/stripe/stripe.controller.ts:413`
   - May log sensitive event data in development

3. **Missing**: No audit logging for sensitive operations (share link creation, deletion)

---

### A10:2021 – Server-Side Request Forgery (SSRF)

**Rating: 🟢 LOW RISK**

#### Findings:

1. **✅ No direct SSRF vectors found**
   - URLs handled through Firebase SDK
   - AssemblyAI integration uses predefined endpoints

---

## Additional Security Findings (Beyond OWASP Top 10)

### XSS Protection

**Rating: ✅ GOOD**

- 3 files use `dangerouslySetInnerHTML`:
  - `landing/page.tsx` - Static content only
  - `privacy/page.tsx` - Static content only
  - `terms/page.tsx` - Static content only
- User-generated content properly escaped in React components

### Firebase Storage Rules

**File**: `firebase/storage.rules`

| Issue | Severity |
|-------|----------|
| Audio file size limit (100MB) doesn't match tier-based limits | 🟡 Medium |
| Profile photos readable by all authenticated users | 🟡 Medium |
| video/mp4 allowed but not documented | 🟢 Low |

### Firestore Rules

**File**: `firebase/firestore.rules`

- User updates blocked for `role` and `subscription` fields ✅
- Delete operations appropriately restricted ✅

---

## Remediation Priority Matrix

### Immediate (Critical - Fix Now)

| # | Issue | File | Line |
|---|-------|------|------|
| 1 | Hash share link passwords with bcrypt | transcription.service.ts | 1704 |
| 2 | Sanitize uploaded filenames with `path.basename()` | transcription.service.ts | 231 |

### Short-term (High - Fix This Week)

| # | Issue | File | Line |
|---|-------|------|------|
| 3 | Reduce signed URL expiration to 5 hours | firebase.service.ts | 275 |
| 4 | Enforce strict `/tmp` path restriction | audio-splitter.ts | 59-62 |
| 5 | Use cryptographic random for temp filenames | transcription.service.ts | 237, 540 |
| 6 | Restrict profile photo reads to owner only | storage.rules | 36 |

### Medium-term (Medium - Fix This Month)

| # | Issue | File | Action |
|---|-------|------|--------|
| 7 | Add input length limits for AI prompts | transcription.service.ts | Add MAX_CONTEXT_LENGTH check |
| 8 | Add WebSocket CORS fallback validation | websocket.gateway.ts | Add hardcoded fallback |
| 9 | Increase share token length to 16 chars | transcription.service.ts | Update nanoid call |
| 10 | Add audit logging for sensitive operations | New file | Create audit.service.ts |
| 11 | Add exponential backoff for failed share passwords | transcription.service.ts | Track attempts |
| 12 | Align password policies (frontend/backend) | ResetPasswordForm.tsx | Update validation |

---

## Positive Security Practices Observed

The codebase demonstrates many good security practices:

- ✅ Firebase Auth with email verification enforcement
- ✅ Bcrypt hashing for verification codes (12 rounds)
- ✅ Rate limiting on authentication endpoints
- ✅ Comprehensive security headers via Helmet
- ✅ Error message sanitization in production
- ✅ CORS whitelist approach
- ✅ Stripe webhook signature verification
- ✅ User isolation in database queries
- ✅ No eval() or dynamic code execution
- ✅ Proper React escaping of user content
- ✅ Constant-time comparison for sensitive operations

---

## Files Requiring Changes

### Critical Priority
- `apps/api/src/transcription/transcription.service.ts`
- `apps/api/src/firebase/firebase.service.ts`

### High Priority
- `apps/api/src/utils/audio-splitter.ts`
- `firebase/storage.rules`

### Medium Priority
- `apps/api/src/websocket/websocket.gateway.ts`
- `apps/web/components/ResetPasswordForm.tsx`

---

## Conclusion

Neural Summary has a solid security foundation but requires immediate attention to **critical cryptographic issues** (plaintext passwords, long-lived URLs) and **injection vulnerabilities** (path traversal). Most issues are implementation-level fixes that don't require architectural changes.

**Recommended Next Steps**:
1. Fix critical issues immediately (items 1-2)
2. Schedule high-priority fixes for this week (items 3-6)
3. Plan medium-priority improvements for the next sprint
4. Consider a penetration test after remediation
