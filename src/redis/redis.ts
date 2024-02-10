import { createClient } from 'redis';

export const subscriber = createClient();
export const publisher = createClient();
