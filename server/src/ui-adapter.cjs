'use strict';

const { randomUUID } = require('node:crypto');

const MAX_ENVELOPE_BYTES = 16 * 1024;
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const ALLOWED_KINDS = new Set(['request', 'response', 'event', 'snapshot', 'patch', 'error']);

function assertSafeObject(value) {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) assertSafeObject(item);
    return;
  }
  for (const key of Object.getOwnPropertyNames(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      const err = new Error('Chave de objeto proibida.');
      err.code = 'INVALID_ENVELOPE';
      throw err;
    }
    assertSafeObject(value[key]);
  }
}

function validateUiEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    const err = new Error('Envelope inválido.');
    err.code = 'INVALID_ENVELOPE';
    throw err;
  }
  const json = JSON.stringify(envelope);
  if (Buffer.byteLength(json, 'utf8') > MAX_ENVELOPE_BYTES) {
    const err = new Error('Envelope excede 16 KiB.');
    err.code = 'PAYLOAD_TOO_LARGE';
    throw err;
  }
  assertSafeObject(envelope);
  if (envelope.protocolVersion !== 1) {
    const err = new Error('Versão de protocolo não suportada.');
    err.code = 'UNSUPPORTED_PROTOCOL';
    throw err;
  }
  if (!ALLOWED_KINDS.has(envelope.kind)) {
    const err = new Error('Tipo de envelope inválido.');
    err.code = 'INVALID_ENVELOPE';
    throw err;
  }
  if (typeof envelope.sessionId !== 'string' || !envelope.sessionId) {
    const err = new Error('Sessão ausente.');
    err.code = 'SESSION_MISMATCH';
    throw err;
  }
  if (typeof envelope.moduleId !== 'string' || !envelope.moduleId) {
    const err = new Error('moduleId inválido.');
    err.code = 'INVALID_ENVELOPE';
    throw err;
  }
  return envelope;
}

function registerAlchemyUiHandlers(router, service, { moduleId = 'alchemy' } = {}) {
  if (!router || typeof router.register !== 'function') {
    throw new Error('UiServerRouter inválido.');
  }
  const wrap = fn => async (ctx, payload) => {
    try {
      assertSafeObject(payload);
      return await fn(ctx, payload);
    } catch (err) {
      return {
        ok: false,
        code: err?.code || 'REQUEST_FAILED',
        message: err?.message || 'Falha na operação de alquimia.'
      };
    }
  };

  router.register(moduleId, 'snapshot', wrap((ctx) => service.getSnapshot(ctx)));
  router.register(moduleId, 'prepare', wrap((ctx, payload) => service.prepare(ctx, payload)));
  router.register(moduleId, 'craft', wrap((ctx, payload) => service.craft(ctx, payload)));
  router.register(moduleId, 'cancel', wrap((ctx, payload) => service.cancel(ctx, payload)));
  router.register(moduleId, 'close', wrap((ctx, payload) => service.cancel(ctx, payload)));

  return {
    moduleId,
    async dispatchEnvelope(rawEnvelope, serverContext) {
      let envelope;
      try {
        envelope = validateUiEnvelope(rawEnvelope);
        if (envelope.sessionId !== serverContext.expectedSessionId) {
          return {
            protocolVersion: 1,
            kind: 'error',
            messageId: randomUUID(),
            correlationId: envelope.correlationId || randomUUID(),
            sessionId: serverContext.expectedSessionId,
            moduleId: envelope.moduleId,
            error: { code: 'SESSION_MISMATCH', message: 'Sessão inválida.' }
          };
        }
      } catch (err) {
        return {
          protocolVersion: 1,
          kind: 'error',
          messageId: randomUUID(),
          correlationId: rawEnvelope?.correlationId || randomUUID(),
          sessionId: serverContext?.expectedSessionId,
          moduleId: rawEnvelope?.moduleId || moduleId,
          error: { code: err.code || 'INVALID_ENVELOPE', message: err.message }
        };
      }

      const handler = router.getHandler?.(envelope.moduleId, envelope.action);
      if (!handler) {
        return {
          protocolVersion: 1,
          kind: 'error',
          messageId: randomUUID(),
          correlationId: envelope.correlationId,
          sessionId: envelope.sessionId,
          moduleId: envelope.moduleId,
          error: { code: 'ACTION_UNAVAILABLE', message: 'Ação de Alquimia não registrada no servidor.' }
        };
      }

      const payload = await handler(serverContext, envelope.payload || {});
      return {
        protocolVersion: 1,
        kind: 'response',
        messageId: randomUUID(),
        correlationId: envelope.correlationId,
        sessionId: envelope.sessionId,
        moduleId: envelope.moduleId,
        revision: payload?.revision,
        payload
      };
    }
  };
}

module.exports = {
  MAX_ENVELOPE_BYTES,
  assertSafeObject,
  registerAlchemyUiHandlers,
  validateUiEnvelope
};
