# Security & Compliance Guide

## HIPAA Compliance Considerations

### Overview
This backend is designed with HIPAA compliance in mind, but achieving full compliance requires proper configuration, operational procedures, and legal agreements.

### Technical Safeguards

#### 1. Encryption

**Data in Transit**
- ✅ HTTPS/TLS 1.2+ required in production
- ✅ Database connections encrypted (MongoDB SSL/TLS)
- ✅ Redis connections can be encrypted
- ✅ S3 transfers use HTTPS

**Data at Rest**
- ✅ PII/PHI encryption utility provided (`utils/encryption.ts`)
- ✅ MongoDB encryption at rest (enable in Atlas)
- ✅ S3 server-side encryption (SSE-S3 or SSE-KMS)
- ⚠️  Application-level field encryption for sensitive data

#### 2. Access Controls

**Authentication**
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Refresh token rotation
- ⚠️  TODO: Implement 2FA for admin accounts
- ⚠️  TODO: Password complexity requirements

**Authorization**
- ✅ Role-based access control (RBAC)
- ✅ Tenant isolation
- ✅ API key per tenant
- ✅ Rate limiting

**Audit Logging**
- ✅ AuditLog model for all data access
- ✅ Request ID tracking
- ✅ User action logging
- ⚠️  TODO: Immutable audit logs

#### 3. Data Integrity

- ✅ Input validation (Joi/Zod)
- ✅ MongoDB schema validation
- ✅ HMAC webhook verification
- ✅ Replay attack prevention (timestamps)

### Administrative Safeguards

#### Required Policies & Procedures

1. **Access Management**
   - Document who has access to PHI
   - Regular access reviews
   - Immediate revocation on termination
   - Least privilege principle

2. **Workforce Training**
   - HIPAA awareness training
   - Security incident response
   - Data handling procedures

3. **Incident Response Plan**
   - Breach notification procedures (72 hours)
   - Security incident log
   - Corrective action plans

4. **Business Associate Agreements (BAA)**
   - ✅ Required with: Bland Voice, AWS, MongoDB Atlas, hosting provider
   - ⚠️  Ensure all BAAs are signed before production

### Data Retention & Disposal

```typescript
// Configure in .env
CALL_RECORDING_RETENTION_DAYS=90
TRANSCRIPTION_RETENTION_DAYS=365
AUDIT_LOG_RETENTION_DAYS=730
```

**Automatic Cleanup** (TODO: Implement cron job)
```typescript
// scripts/cleanup.ts
async function cleanupExpiredData() {
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - config.retention.callRecordingDays);
  
  await CallLog.deleteMany({ createdAt: { $lt: retentionDate } });
}
```

### GDPR Compliance

#### User Rights

1. **Right to Access**
   ```bash
   GET /api/admin/data-export?userId={userId}
   ```

2. **Right to Erasure**
   ```bash
   DELETE /api/admin/users/{userId}/gdpr-delete
   ```

3. **Right to Rectification**
   ```bash
   PATCH /api/admin/users/{userId}
   ```

4. **Data Portability**
   - Export user data in JSON format
   - Include all associated records

#### Consent Management

```typescript
// TODO: Implement consent tracking
interface Consent {
  userId: string;
  purpose: string;
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
}
```

### Production Security Checklist

#### Pre-Deployment

- [ ] Change all default credentials
- [ ] Generate strong JWT_SECRET (32+ chars)
- [ ] Enable MongoDB authentication
- [ ] Enable Redis password
- [ ] Configure S3 bucket policies (private)
- [ ] Review CORS origins
- [ ] Enable rate limiting
- [ ] Configure helmet security headers
- [ ] Set up HTTPS/TLS certificates
- [ ] Review environment variables
- [ ] Remove debug/dev endpoints
- [ ] Sign BAAs with all vendors

#### Infrastructure

- [ ] Use VPC/private networks
- [ ] Configure firewall rules (whitelist only)
- [ ] Enable database backups
- [ ] Set up monitoring/alerting
- [ ] Configure log aggregation
- [ ] Implement DDoS protection
- [ ] Use secret management (Vault, AWS Secrets Manager)
- [ ] Regular security updates
- [ ] Vulnerability scanning

#### Application

- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens (if applicable)
- [ ] Secure session management
- [ ] Password policies enforced
- [ ] Account lockout after failed attempts
- [ ] Sensitive data masking in logs
- [ ] Error messages don't leak info

#### Monitoring

- [ ] Failed login attempts
- [ ] Unusual access patterns
- [ ] High error rates
- [ ] Performance degradation
- [ ] Unauthorized access attempts
- [ ] Data export activities

### Incident Response Procedures

#### Security Breach Steps

1. **Immediate Actions** (0-1 hour)
   - Isolate affected systems
   - Preserve evidence
   - Notify security team
   - Document everything

2. **Assessment** (1-4 hours)
   - Determine scope of breach
   - Identify compromised data
   - Assess impact

3. **Containment** (4-24 hours)
   - Stop the breach
   - Patch vulnerabilities
   - Reset credentials
   - Review access logs

4. **Notification** (within 72 hours)
   - Notify affected individuals
   - Report to authorities (if required)
   - Notify business associates

5. **Recovery**
   - Restore from backups
   - Implement fixes
   - Monitor for recurrence

6. **Post-Incident**
   - Document lessons learned
   - Update security procedures
   - Provide additional training

### Encryption Examples

#### Encrypting PHI

```typescript
import { encrypt, decrypt } from './utils/encryption';

// Encrypt patient data
const patientSSN = '123-45-6789';
const encryptedSSN = encrypt(patientSSN);

// Store encrypted in database
callLog.metadata.patientSSN = encryptedSSN;

// Decrypt when needed
const decryptedSSN = decrypt(callLog.metadata.patientSSN);
```

#### Database Field Encryption

```typescript
// In CallLog model
CallLogSchema.pre('save', function(next) {
  if (this.metadata.patientSSN && this.isModified('metadata.patientSSN')) {
    this.metadata.patientSSN = encrypt(this.metadata.patientSSN);
  }
  next();
});
```

### Webhook Security

#### HMAC Signature Verification

```typescript
// Verify Bland webhook
const signature = req.headers['x-bland-signature'];
const payload = JSON.stringify(req.body);
const expectedSignature = createHmac('sha256', config.bland.webhookSecret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

#### Replay Attack Prevention

```typescript
// Add timestamp validation
const timestamp = req.headers['x-bland-timestamp'];
const now = Date.now();
const requestTime = parseInt(timestamp);

// Reject requests older than 5 minutes
if (Math.abs(now - requestTime) > 300000) {
  return res.status(401).json({ error: 'Request expired' });
}
```

### Regular Security Tasks

#### Daily
- Review error logs
- Check failed login attempts
- Monitor system resources

#### Weekly
- Review access logs
- Check for security updates
- Verify backups

#### Monthly
- Access review (remove unused accounts)
- Update dependencies
- Security scan

#### Quarterly
- Penetration testing
- Security policy review
- Training refresh
- BAA review

### Compliance Resources

- **HIPAA**: https://www.hhs.gov/hipaa
- **GDPR**: https://gdpr.eu
- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework
- **OWASP Top 10**: https://owasp.org/www-project-top-ten

### Legal Disclaimers

⚠️ **Important**: This application provides technical safeguards but does not guarantee HIPAA or GDPR compliance on its own. Compliance requires:

1. Proper configuration and deployment
2. Operational procedures and policies
3. Signed Business Associate Agreements
4. Regular security audits
5. Staff training
6. Legal counsel review

Consult with legal and compliance experts before handling PHI/PII in production.

---

**Last Updated**: November 2024
