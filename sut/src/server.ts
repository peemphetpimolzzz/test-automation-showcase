import { createApp } from './app';

// The container always listens on 3000; the host port is mapped in compose.
const PORT = Number(process.env.PORT ?? 3000);

const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Tasks API listening on port ${PORT}`);
});
