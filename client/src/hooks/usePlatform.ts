import { useState, useEffect } from 'react';

export type Platform = 'ios-safari' | 'android-chrome' | 'samsung-internet' | 'desktop-chromium' | 'other';

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>('other');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isChrome = /chrome/.test(userAgent);
    const isSamsung = /samsungbrowser/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isDesktop = !/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

    if (isIOS && isSafari) {
      setPlatform('ios-safari');
    } else if (isAndroid && isSamsung) {
      setPlatform('samsung-internet');
    } else if (isAndroid && isChrome) {
      setPlatform('android-chrome');
    } else if (isDesktop && isChrome) {
      setPlatform('desktop-chromium');
    } else {
      setPlatform('other');
    }
  }, []);

  return platform;
}