import { existsSync } from 'node:fs';
import { profile } from '../data/profile';

// The Resume button only renders once a PDF is actually in public/.
export const hasResume = existsSync(`public${profile.resumePath}`);
