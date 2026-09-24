import { runSavedSearchMatching } from "../matching/run-saved-search-matching";
import type { MatchJobData, Queues } from "../queues";

export async function processMatchJob(queues: Queues, data: MatchJobData): Promise<void> {
  await runSavedSearchMatching(queues, data.listingId, data.priceChange ?? null);
}
