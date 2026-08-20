export const extractUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

export const detectPlatform = (url: string): string => {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'Instagram';
  if (lower.includes('tiktok.com')) return 'TikTok';
  if (lower.includes('pinterest.com') || lower.includes('pin.it') || lower.includes('pinimg.com')) return 'Pinterest';
  if (lower.includes('reddit.com') || lower.includes('redd.it') || lower.includes('v.redd.it') || lower.includes('i.redd.it')) return 'Reddit';
  if (lower.includes('threads.net') || lower.includes('threads.com')) return 'Threads';
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) return 'Facebook';
  if (lower.includes('x.com') || lower.includes('twitter.com') || lower.includes('t.co')) return 'X / Twitter';
  if (lower.match(/\.(mp4|webm|mp3|wav|jpg|jpeg|png|webp|gif|avif)(\?|$)/i)) return 'Direct Media';
  return 'Direct URL';
};
