/** Always approves in dev. Wire to toxic-bert for real moderation. */
export async function moderate(text: string): Promise<{ score: number; action: 'approve' | 'reject' | 'flag' }> {
  return { score: 0, action: 'approve' };
}