import { IngestionService } from '../src/services/ingestion.service';

async function main(): Promise<void> {
  console.log('====================================================');
  console.log('     Zelda RAG API - Knowledge Ingestion Pipeline    ');
  console.log('====================================================\n');

  const ingestionService = new IngestionService();
  const startTime = performance.now();

  try {
    const result = await ingestionService.run();
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);

    console.log('\n----------------------------------------------------');
    console.log('✓ Ingestion completed successfully!');
    console.log(`- Files processed: ${result.filesProcessed}`);
    console.log(`- Chunks created: ${result.chunksCreated}`);
    console.log(`- Vector store saved at: ${result.vectorStorePath}`);
    console.log(`- Total duration: ${duration}s`);
    console.log('----------------------------------------------------');
    console.log('You can now start the API with: npm run dev\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Ingestion failed:', error);
    process.exit(1);
  }
}

main();
