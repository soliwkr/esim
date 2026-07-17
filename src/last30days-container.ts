import { Container } from '@cloudflare/containers';

export class Last30DaysContainer extends Container {
  defaultPort = 8080;
  requiredPorts = [8080];
  sleepAfter = '2m';
  enableInternet = true;

  override onStart(): void {
    console.log('last30days container started');
  }

  override onStop(): void {
    console.log('last30days container stopped');
  }

  override onError(error: unknown): void {
    console.error('last30days container error', error);
  }
}
