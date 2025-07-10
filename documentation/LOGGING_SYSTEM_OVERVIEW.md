# Logging System Overview

## Modern Logging Architecture (2025 Standards)

The Keystroke App implements a sophisticated, multi-layered logging system designed for modern web applications with enterprise-grade observability, performance monitoring, and autonomous debugging capabilities.

## System Architecture

### Core Components

1. **`clientLogger.ts`** - Environment-aware client-side logging with browser/server detection
2. **`serverLogger.ts`** - Server-side logging with file system persistence
3. **`modernLogger.ts`** - Centralized modern logger with enhanced features (NEW)
4. **`otelLogger.ts`** - OpenTelemetry-compatible observability layer (NEW)
5. **`debugReader.ts`** - AI-powered autonomous debugging and log analysis
6. **`loggingConfig.ts`** - Environment-specific configuration management (NEW)

### Enhanced Features (2025 Standards)

#### 1. **Structured Logging with Context Enrichment**

- Automatic context assembly with user ID, session ID, trace ID
- Environment detection (browser vs server)
- Performance metrics correlation
- Error stack trace preservation

#### 2. **Multi-Destination Logging**

```typescript
// Automatically routes to appropriate destinations
await log.info('User action completed', { userId, action: 'profile_update' });
// → Console (development)
// → File system (server-side)
// → localStorage (browser-side)
// → External services (OpenTelemetry, DataDog)
```

#### 3. **Privacy and Security Compliance**

- Automatic PII detection and redaction
- Sensitive data pattern masking
- GDPR-compliant logging policies
- Configurable data retention

#### 4. **Performance Monitoring Integration**

- Automatic performance metrics collection
- Core Web Vitals tracking
- Memory leak detection
- Long task monitoring

#### 5. **Autonomous Debugging**

- AI-powered log analysis
- Pattern recognition for common issues
- Automatic health monitoring
- Actionable recommendations

## Usage Patterns

### Basic Logging

```typescript
import { log } from '@/core/infrastructure/monitoring/modernLogger';

// Standard log levels
await log.debug('Debug information', { context });
await log.info('Information message', { context });
await log.warn('Warning message', { context });
await log.error('Error occurred', error, { context });
```

### Specialized Logging

```typescript
// Performance logging
await log.performance('Database query completed', 250, {
  query: 'getUserProfile',
  userId,
});

// Business event logging
await log.business('User subscription created', {
  userId,
  plan: 'premium',
});

// Security event logging
await log.security('Failed login attempt', {
  ip,
  userAgent,
});

// Request logging
await log.request('POST', '/api/users', 201, 150, {
  userId,
  requestId,
});
```

### React Component Logging

```typescript
import {
  usePerformanceLogging,
  useErrorBoundaryLogging,
} from '@/hooks/useModernLogging';

function MyComponent() {
  // Automatic performance monitoring
  usePerformanceLogging('MyComponent', 16); // 16ms threshold

  // Error boundary integration
  const logError = useErrorBoundaryLogging('MyComponent');

  // Component-specific logging with automatic context
  const componentLog = useComponentLogging('MyComponent');

  const handleAction = async () => {
    await componentLog.info('User action triggered', {
      action: 'button_click',
    });
  };
}
```

## Configuration

### Environment-Based Configuration

```typescript
// Automatic configuration based on NODE_ENV
development: {
  logLevel: 'debug',
  enabledSources: ['console', 'file'],
  redactSensitiveData: false,
  enablePerformanceLogging: true,
  flushInterval: 1000
}

production: {
  logLevel: 'warn',
  enabledSources: ['otel'],
  redactSensitiveData: true,
  enablePerformanceLogging: false,
  flushInterval: 10000
}
```

### Custom Configuration

```typescript
import { initializeLogging } from '@/core/infrastructure/monitoring/loggingConfig';

// Initialize with custom settings
await initializeLogging();

// Update configuration at runtime
updateLoggingConfig({
  logLevel: 'info',
  enabledSources: ['console', 'file', 'otel'],
});
```

## Advanced Features

### 1. **Correlation and Tracing**

- Automatic request correlation with trace IDs
- Cross-service request tracking
- User journey correlation
- Performance bottleneck identification

### 2. **Autonomous Debugging**

```typescript
import { DebugReader } from '@/core/infrastructure/monitoring/debugReader';

// AI-powered system analysis
const healthReport = await DebugReader.getSystemHealthReport();
const issueAnalysis = await DebugReader.analyzeCurrentState();
const specificIssue = await DebugReader.searchForIssue(
  'authentication failure',
);
```

### 3. **Real-time Monitoring**

- Live log streaming in development
- Performance metrics dashboard
- Error rate monitoring
- Memory usage tracking

### 4. **Privacy-First Design**

- Automatic PII redaction
- Configurable data masking
- Secure data transmission
- Compliant data retention

## Integration with External Services

### OpenTelemetry Integration

```typescript
// Automatic OTLP export to observability platforms
OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=https://api.honeycomb.io/v1/logs
HONEYCOMB_API_KEY=your_api_key
```

### DataDog Integration

```typescript
// Direct integration with DataDog logs
DATADOG_LOGS_ENDPOINT=https://http-intake.logs.datadoghq.com/v1/input
DATADOG_API_KEY=your_api_key
```

## Best Practices

### 1. **Contextual Logging**

```typescript
// ✅ Good - Rich context
await log.info('User profile updated', {
  userId: user.id,
  updatedFields: ['email', 'preferences'],
  timestamp: Date.now(),
  userAgent: req.headers['user-agent'],
});

// ❌ Avoid - Minimal context
await log.info('Profile updated');
```

### 2. **Performance-Aware Logging**

```typescript
// ✅ Good - Async logging
await log.performance('Heavy operation', duration, context);

// ✅ Good - Batch operations
const timer = performance.now();
await heavyOperation();
await log.performance('Heavy operation', performance.now() - timer);
```

### 3. **Error Handling**

```typescript
// ✅ Good - Structured error logging
try {
  await riskyOperation();
} catch (error) {
  await log.error('Operation failed', error, {
    operation: 'riskyOperation',
    userId,
    recoveryAction: 'retry_with_fallback',
  });
  throw error; // Re-throw if needed
}
```

### 4. **Security-Conscious Logging**

```typescript
// ✅ Good - Automatic PII redaction
await log.info('User login', {
  email: user.email, // Automatically redacted in production
  loginMethod: 'oauth',
});

// ✅ Good - Manual sensitive data handling
await log.security('Payment processed', {
  userId,
  amount,
  // Don't log: credit card numbers, full names, addresses
});
```

## Debugging Workflows

### 1. **Development Debugging**

```typescript
// Access debugging tools in browser console
window.KeystrokeDebug.analyzeCurrentState();
window.KeystrokeDebug.getSystemHealthReport();
window.KeystrokeDebug.searchLogs('authentication');
```

### 2. **Production Issue Investigation**

```typescript
// Server-side log analysis
const issues = await DebugReader.searchForIssue('payment failure');
const patterns = await DebugReader.detectPatterns('error');
const recommendations = await DebugReader.getActionableRecommendations();
```

## Monitoring and Alerting

### Performance Monitoring

- Automatic Core Web Vitals tracking
- Long task detection (>50ms)
- Memory leak monitoring
- Bundle size impact tracking

### Error Monitoring

- Unhandled exception capture
- Promise rejection tracking
- Resource loading failure detection
- API error correlation

### Business Metrics

- User journey tracking
- Feature usage analytics
- Performance impact assessment
- A/B test result correlation

## Migration from Legacy Logging

### Gradual Migration Strategy

1. **Phase 1**: Install new logging system alongside existing
2. **Phase 2**: Update critical paths to use modern logger
3. **Phase 3**: Replace all console.log calls with structured logging
4. **Phase 4**: Enable advanced features (OpenTelemetry, autonomous debugging)
5. **Phase 5**: Remove legacy logging code

### Compatibility Layer

```typescript
// Legacy console.log replacement
import { log } from '@/core/infrastructure/monitoring/modernLogger';

// Automatic migration helper
console.log = (...args) => log.info(args.join(' '));
console.error = (...args) => log.error(args.join(' '));
console.warn = (...args) => log.warn(args.join(' '));
```

## Performance Considerations

- **Asynchronous by default** - Non-blocking logging operations
- **Batched transmission** - Efficient log aggregation and sending
- **Memory management** - Circular buffer with automatic cleanup
- **Network optimization** - Compressed log transmission
- **CPU efficiency** - Lazy context enrichment

## Compliance and Security

- **GDPR Compliance** - Automatic PII detection and handling
- **SOC 2 Ready** - Audit trail and data integrity
- **HIPAA Compatible** - Healthcare data protection
- **Zero-trust Architecture** - Secure log transmission and storage

---

_This logging system represents the evolution of application observability, combining traditional logging with modern observability practices, AI-powered debugging, and privacy-first design principles._
