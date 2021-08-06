import {errorMessage} from './misc';
import chalk from 'chalk';

export function logInfo(message: string): void {
  console.log(message);
}

export function logError(message: unknown): void {
  console.error(chalk.red(errorMessage(message)));
}

export function logSuccess(message: string): void {
  console.log(chalk.green(message));
}
