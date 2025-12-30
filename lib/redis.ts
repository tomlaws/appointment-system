import { createClient } from "redis"

const client = process.env.REDIS_URL ? createClient({
  url: process.env.REDIS_URL,
}) : null;

async function set(key: string, value: string, expirationInSeconds?: number) {
  if (!client) return null;
  if (!client.isOpen) await client.connect();
  if (expirationInSeconds) {
    return await client.setEx(key, expirationInSeconds, value);
  } else {
    return await client.set(key, value);
  }
}

async function get(key: string) {
  if (!client) return null;
  if (!client.isOpen) await client.connect();
  return await client.get(key);
}

async function setJson(key: string, value: any, expirationInSeconds?: number) {
  if (!client) return null;
  if (!client.isOpen) await client.connect();
  const stringValue = JSON.stringify(value);
  if (expirationInSeconds) {
    return await client.setEx(key, expirationInSeconds, stringValue);
  } else {
    return await client.set(key, stringValue);
  }
}

async function getJson(key: string) {
  if (!client) return null;
  if (!client.isOpen) await client.connect();
  const value = await client.get(key);
  return value ? JSON.parse(value) : null;
}

async function del(key: string) {
  if (!client) return null;
  if (!client.isOpen) await client.connect();
  return await client.del(key);
}

export const redis = {
  set,
  get,
  setJson,
  getJson,
  del,
};