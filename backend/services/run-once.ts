// Lightweight runner to execute a single collection cycle.
import { MCPEventCollector } from './MCPEventCollector';

async function main() {
  const collector = new MCPEventCollector();
  try {
    await collector.initialize();
    await collector.runOnce();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await collector.destroy();
  }
}

main();

