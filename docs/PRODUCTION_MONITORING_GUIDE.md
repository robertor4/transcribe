# Production Monitoring Guide

This guide explains how to monitor security events in your production application.

## Overview

The security monitoring system automatically logs:
- **Rate limit hits** (429) - Potential abuse or misconfigured clients
- **Validation errors** (400) - Invalid input or injection attempts
- **Auth failures** (401/403) - Unauthorized access attempts
- **Server errors** (500+) - Application issues
- **Slow requests** (>1s) - Performance problems

---

## Quick Start

### 1. Enable the Logging Interceptor (Optional)

The logging interceptor is **already created** but not yet enabled. To activate it:

```typescript
// apps/api/src/app.module.ts
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  providers: [
    // ... existing providers
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

### 2. View Logs in Production

**Local Development:**
```bash
npm run dev  # Logs appear in console with colors
```

**Production (Docker):**
```bash
# View live logs
docker logs -f transcribe-api

# View last 100 lines
docker logs --tail 100 transcribe-api

# Search for rate limit hits
docker logs transcribe-api | grep "RATE LIMIT HIT"

# Search for validation errors
docker logs transcribe-api | grep "VALIDATION ERROR"
```

**Production (PM2):**
```bash
# View logs
pm2 logs api

# View only errors
pm2 logs api --err

# Save logs to file
pm2 logs api --out /var/log/api-out.log --err /var/log/api-err.log
```

---

## Understanding the Logs

### Log Format

All security logs follow this structure:

```json
{
  "statusCode": 429,
  "method": "POST",
  "url": "/transcriptions",
  "userId": "abc123xyz",
  "ip": "192.168.1.xxx",
  "userAgent": "Mozilla/5.0...",
  "duration": "45ms",
  "timestamp": "2025-10-26T12:00:00.000Z",
  "severity": "MEDIUM",
  "action": "BLOCKED",
  "message": "User exceeded rate limit"
}
```

---

## Security Events Reference

### 1. Rate Limit Hit (429)

**What it means:** A user/IP exceeded the request rate limit

**Log Example:**
```
[SecurityMonitor] ⚠️  RATE LIMIT HIT {
  statusCode: 429,
  userId: "user_123",
  ip: "192.168.1.xxx",
  url: "/transcriptions",
  severity: "MEDIUM"
}
```

**What to do:**
- ✅ **Normal**: Occasional hits are expected (bots, aggressive clients)
- ⚠️ **Investigate**: Same user/IP hitting limit repeatedly (>10 times/hour)
- 🚨 **Alert**: Distributed pattern (multiple IPs) - possible DDoS

**Common Causes:**
- Mobile app with aggressive retry logic
- Browser extensions making duplicate requests
- Automated testing without delays
- Actual attack/abuse

**Action:**
```bash
# Check if specific user is being rate limited frequently
docker logs transcribe-api | grep "RATE LIMIT" | grep "user_123"

# Check if specific IP is being blocked
docker logs transcribe-api | grep "RATE LIMIT" | grep "192.168.1"

# Count rate limit hits in last hour
docker logs transcribe-api --since 1h | grep "RATE LIMIT" | wc -l
```

---

### 2. Validation Error (400)

**What it means:** User sent invalid data (wrong type, missing field, etc.)

**Log Example:**
```
[SecurityMonitor] 🔍 VALIDATION ERROR {
  statusCode: 400,
  url: "/transcriptions?page=-1&pageSize=20",
  errors: ["page must not be less than 1"],
  severity: "LOW"
}
```

**What to do:**
- ✅ **Normal**: Occasional validation errors from user mistakes
- ⚠️ **Investigate**: Repeated errors from same user (>20 times/hour) - possible probe
- 🚨 **Alert**: Many validation errors across users - possible vulnerability scan

**Common Causes:**
- User typo (entered -1 instead of 1)
- Client app bug (sending wrong data type)
- API version mismatch (old client, new API)
- **Security probe** (attacker testing input validation)

**Red Flags (Potential Attack):**
- Errors with SQL/NoSQL keywords: `"'; DROP TABLE--"`, `{"$gt": ""}`
- Errors with XSS payloads: `"<script>alert(1)</script>"`
- Errors with path traversal: `"../../etc/passwd"`
- Systematic testing of all parameters

**Action:**
```bash
# Find most common validation errors
docker logs transcribe-api | grep "VALIDATION ERROR" | \
  jq -r '.errors[]' | sort | uniq -c | sort -rn | head -20

# Check for injection attempts
docker logs transcribe-api | grep "VALIDATION ERROR" | \
  grep -E "script|SELECT|DROP|\.\./"
```

---

### 3. Authentication Failure (401)

**What it means:** Invalid or missing authentication token

**Log Example:**
```
[SecurityMonitor] 🚫 AUTH FAILURE {
  statusCode: 401,
  url: "/transcriptions",
  userId: "anonymous",
  message: "Authentication failed",
  severity: "MEDIUM"
}
```

**What to do:**
- ✅ **Normal**: Expired tokens, logged-out users
- ⚠️ **Investigate**: Repeated failures from same IP (>50 times/hour)
- 🚨 **Alert**: Brute force pattern (testing many tokens)

**Common Causes:**
- User token expired (Firebase tokens expire after 1 hour)
- User deleted account but client still has token
- Browser cleared cookies
- **Brute force attack** (trying random tokens)

**Action:**
```bash
# Count auth failures per IP
docker logs transcribe-api | grep "AUTH FAILURE" | \
  jq -r '.ip' | sort | uniq -c | sort -rn | head -10

# Check for brute force (>50 failures from one IP)
docker logs transcribe-api --since 1h | grep "AUTH FAILURE" | \
  jq -r '.ip' | uniq -c | awk '$1 > 50'
```

---

### 4. Authorization Failure (403)

**What it means:** Authenticated user tried to access forbidden resource

**Log Example:**
```
[SecurityMonitor] 🚫 AUTHORIZATION FAILURE {
  statusCode: 403,
  userId: "user_123",
  url: "/transcriptions/xyz789",
  message: "Insufficient permissions",
  severity: "MEDIUM"
}
```

**What to do:**
- ✅ **Normal**: User clicked old link, shared URL expired
- ⚠️ **Investigate**: User repeatedly accessing others' resources
- 🚨 **Alert**: Enumeration attack (testing many transcription IDs)

**Common Causes:**
- User trying to access deleted transcription
- User clicked someone else's share link (expired password)
- **Enumeration attack** (guessing transcription IDs)

**Red Flags:**
- Same user, many different transcription IDs in short time
- Sequential IDs: `/transcriptions/001`, `/transcriptions/002`, etc.

**Action:**
```bash
# Find users with most 403 errors
docker logs transcribe-api | grep "AUTHORIZATION FAILURE" | \
  jq -r '.userId' | sort | uniq -c | sort -rn | head -10

# Check for enumeration (same user, many URLs)
docker logs transcribe-api --since 5m | grep "AUTHORIZATION FAILURE" | \
  jq -r '"\(.userId) \(.url)"' | sort
```

---

### 5. Server Error (500)

**What it means:** Something broke in the application

**Log Example:**
```
[SecurityMonitor] 💥 SERVER ERROR {
  statusCode: 500,
  url: "/transcriptions",
  error: "Cannot read property 'uid' of undefined",
  severity: "HIGH"
}
```

**What to do:**
- 🚨 **Always investigate** - These should be rare
- Fix the underlying bug
- Check if error is triggered by specific input (possible exploit)

---

## Monitoring Best Practices

### 1. Set Up Alerts

**Slack/Discord Webhook:**
```typescript
// In LoggingInterceptor, add:
private async sendAlert(message: string, context: any) {
  if (context.severity === 'HIGH' || context.severity === 'CRITICAL') {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 ${message}`,
        attachments: [{
          color: 'danger',
          fields: Object.entries(context).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true,
          })),
        }],
      }),
    });
  }
}
```

### 2. Aggregate Logs

**Use a log aggregation service:**
- **Datadog**: Application Performance Monitoring
- **Loggly**: Centralized logging
- **AWS CloudWatch**: If hosting on AWS
- **GCP Cloud Logging**: If hosting on GCP

**Export logs:**
```bash
# Docker logs to file
docker logs transcribe-api > /var/log/api-$(date +%Y%m%d).log

# PM2 logs are already in files
ls /var/log/api-*.log
```

### 3. Create Dashboards

**Example Grafana Dashboard:**
- Chart: Rate limit hits over time
- Chart: Validation errors by endpoint
- Chart: Auth failures by IP
- Alert: >100 rate limit hits in 5 minutes

**Example queries:**
```bash
# Rate limit hits per hour
docker logs transcribe-api --since 24h | \
  grep "RATE LIMIT" | \
  jq -r '.timestamp' | \
  cut -c1-13 | uniq -c

# Top 10 endpoints with validation errors
docker logs transcribe-api | \
  grep "VALIDATION ERROR" | \
  jq -r '.url' | \
  sort | uniq -c | sort -rn | head -10
```

---

## Automated Monitoring Scripts

### Daily Security Report

```bash
#!/bin/bash
# daily-security-report.sh

echo "=== Security Report $(date) ==="
echo ""

echo "Rate Limit Hits (last 24h):"
docker logs transcribe-api --since 24h | grep "RATE LIMIT" | wc -l

echo ""
echo "Validation Errors (last 24h):"
docker logs transcribe-api --since 24h | grep "VALIDATION ERROR" | wc -l

echo ""
echo "Auth Failures (last 24h):"
docker logs transcribe-api --since 24h | grep "AUTH FAILURE" | wc -l

echo ""
echo "Top 5 IPs blocked by rate limiting:"
docker logs transcribe-api --since 24h | grep "RATE LIMIT" | \
  jq -r '.ip' | sort | uniq -c | sort -rn | head -5

echo ""
echo "Top 5 validation errors:"
docker logs transcribe-api --since 24h | grep "VALIDATION ERROR" | \
  jq -r '.errors[]' | sort | uniq -c | sort -rn | head -5
```

**Run daily via cron:**
```bash
# Add to crontab
0 9 * * * /opt/transcribe/scripts/daily-security-report.sh | mail -s "Security Report" admin@example.com
```

---

## What to Look For

### 🟢 Normal Patterns

- **Rate limits**: 1-5 hits per hour
- **Validation errors**: 10-20 per hour (user typos)
- **Auth failures**: 5-10 per hour (expired tokens)
- **403 errors**: 1-5 per hour (old links)

### 🟡 Investigate

- **Rate limits**: 10-50 hits per hour from same user
- **Validation errors**: >50 per hour
- **Auth failures**: >100 per hour
- **403 errors**: >20 per hour from same user

### 🔴 Alert

- **Rate limits**: >100 hits per hour (DDoS?)
- **Validation errors**: SQL/XSS payloads detected
- **Auth failures**: >500 per hour (brute force?)
- **403 errors**: Enumeration pattern detected
- **500 errors**: Any spike (>10 per hour)

---

## Example: Real Attack Detection

### Scenario 1: Brute Force Attack

**Logs:**
```
[SecurityMonitor] 🚫 AUTH FAILURE { ip: "203.0.113.xxx", userId: "anonymous" }
[SecurityMonitor] 🚫 AUTH FAILURE { ip: "203.0.113.xxx", userId: "anonymous" }
[SecurityMonitor] 🚫 AUTH FAILURE { ip: "203.0.113.xxx", userId: "anonymous" }
... (200 more in 5 minutes)
```

**Action:**
```bash
# Block the IP
sudo ufw deny from 203.0.113.0/24

# Or in Traefik (if using)
# Add to docker-compose.yml middlewares
```

### Scenario 2: SQL Injection Attempt

**Logs:**
```
[SecurityMonitor] 🔍 VALIDATION ERROR {
  url: "/transcriptions?page=1' OR '1'='1&pageSize=20",
  errors: ["page must be a number"]
}
```

**Action:**
- ✅ **Good news**: Validation blocked it!
- Log the IP for monitoring
- If repeated, block the IP

### Scenario 3: Resource Enumeration

**Logs:**
```
[SecurityMonitor] 🚫 AUTHORIZATION FAILURE { userId: "user_123", url: "/transcriptions/id_001" }
[SecurityMonitor] 🚫 AUTHORIZATION FAILURE { userId: "user_123", url: "/transcriptions/id_002" }
[SecurityMonitor] 🚫 AUTHORIZATION FAILURE { userId: "user_123", url: "/transcriptions/id_003" }
... (50 more in 1 minute)
```

**Action:**
- Block the user account temporarily
- Review: Is this legitimate? (User clicked multiple old links)
- If malicious: Permanently ban user

---

## Integration with External Tools

### Datadog Example

```typescript
// apps/api/src/common/interceptors/logging.interceptor.ts
import * as ddTrace from 'dd-trace';

private logSecurityEvent(...) {
  // ... existing code

  // Send to Datadog
  if (process.env.DD_API_KEY) {
    ddTrace.tracer().getCurrentSpan()?.setTag('security.event', statusCode);
  }
}
```

### Sentry Example

```typescript
import * as Sentry from '@sentry/node';

if (statusCode >= 500) {
  Sentry.captureException(error, {
    tags: {
      endpoint: url,
      userId,
      statusCode,
    },
  });
}
```

---

## Summary: Daily Monitoring Checklist

- [ ] Check rate limit hits: `docker logs transcribe-api | grep "RATE LIMIT" | wc -l`
- [ ] Check validation errors: `docker logs transcribe-api | grep "VALIDATION ERROR" | wc -l`
- [ ] Check auth failures: `docker logs transcribe-api | grep "AUTH FAILURE" | wc -l`
- [ ] Review any 500 errors: `docker logs transcribe-api | grep "SERVER ERROR"`
- [ ] Check for suspicious patterns: SQL keywords, XSS payloads, enumeration
- [ ] Review top IPs hitting rate limits
- [ ] Verify all alerts were addressed

---

## Next Steps

1. **Enable the interceptor** (see Quick Start)
2. **Test in development**: Make a few API calls, check logs
3. **Set up alerts**: Slack/Discord webhook for critical events
4. **Create dashboard**: Grafana, Datadog, or simple scripts
5. **Review daily**: Spend 5 minutes checking logs each day

**Questions?** Check the logs with these commands:
```bash
# Show all security events from last hour
docker logs transcribe-api --since 1h | grep -E "RATE LIMIT|VALIDATION|AUTH FAILURE|SERVER ERROR"

# Count events by type
docker logs transcribe-api --since 24h | \
  grep -E "RATE LIMIT|VALIDATION|AUTH FAILURE" | \
  sed 's/.*\] //' | cut -d' ' -f1 | sort | uniq -c
```
