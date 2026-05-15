import { useEffect, useState } from 'react';
import { Compass, Share, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type Mode = 'none' | 'android' | 'ios-safari' | 'ios-chrome';

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_WINDOW_MS = 12 * 60 * 60 * 1000;
const APP_ICON = '/icons/app-icon.png';

const detectMode = (): Mode => {
  const ua = navigator.userAgent;
  const isStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  if (isStandalone) return 'none';

  const isIos = /iphone|ipad|ipod/i.test(ua);
  if (isIos) {
    return /CriOS|FxiOS|EdgiOS/.test(ua) ? 'ios-chrome' : 'ios-safari';
  }
  const isAndroid = /android/i.test(ua);
  return isAndroid ? 'android' : 'none';
};

const isRecentlyDismissed = () => {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const at = Number(raw);
  if (!Number.isFinite(at)) return false;
  return Date.now() - at < DISMISS_WINDOW_MS;
};

const markDismissed = () => {
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
};

export const PwaInstallGuide = () => {
  const [mode, setMode] = useState<Mode>('none');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showArrow, setShowArrow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isRecentlyDismissed()) return;

    const initial = detectMode();
    if (initial === 'ios-safari' || initial === 'ios-chrome') {
      setMode(initial);
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (detectMode() === 'android') setMode('android');
    };
    const onInstalled = () => {
      setMode('none');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'ios-safari') return;
    const t1 = window.setTimeout(() => setShowArrow(true), 4000);
    const t2 = window.setTimeout(() => setShowArrow(false), 10000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [mode]);

  const dismiss = () => {
    markDismissed();
    setMode('none');
    setShowArrow(false);
  };

  const installAndroid = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setMode('none');
    if (choice.outcome === 'dismissed') markDismissed();
  };

  const copyUrl = async () => {
    const url = window.location.origin + '/';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (mode === 'none') return null;

  if (mode === 'android') {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
        <div className="bg-[#007DCA] px-6 pt-14 pb-7 text-center text-white">
          <img
            src={APP_ICON}
            alt=""
            className="mx-auto mb-[14px] h-[72px] w-[72px] rounded-[18px] shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
          />
          <h1 className="text-[22px] font-bold">건설인 앱 설치하기</h1>
          <p className="mt-[6px] text-sm opacity-85">홈 화면에 추가하면 앱처럼 바로 실행돼요</p>
        </div>

        <div className="flex flex-1 flex-col justify-end px-5 pb-7">
          <Button onClick={installAndroid} size="full" disabled={!deferredPrompt}>
            앱 설치하기
          </Button>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 w-full rounded-[14px] bg-[#F2F2F7] px-4 py-[14px] text-[15px] text-[#8E8E93]"
          >
            나중에 설치할게요
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'ios-chrome') {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) dismiss();
        }}
      >
        <div className="w-full max-w-[320px] rounded-[20px] bg-white px-6 py-7 text-center">
          <Compass className="mx-auto text-[#007DCA]" size={52} />
          <h2 className="mt-3 mb-2 text-lg font-bold">Safari로 열어주세요</h2>
          <p className="text-sm leading-relaxed text-[#666]">
            앱 설치는 <strong>Safari 브라우저</strong>에서만 가능합니다.
            <br />
            주소를 복사해 Safari에 붙여넣기 해주세요.
          </p>
          <div className="my-[14px] break-all rounded-[10px] bg-[#F2F2F7] px-[14px] py-[10px] text-[13px] font-semibold text-[#007DCA]">
            {window.location.host}
          </div>
          <Button onClick={copyUrl} className="w-full" size="lg">
            {copied ? '✅ 복사됐습니다!' : '📋 주소 복사하기'}
          </Button>
          <button
            type="button"
            onClick={dismiss}
            className="mt-2 w-full rounded-[12px] bg-[#F2F2F7] px-3 py-3 text-[15px] text-[#666]"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  // ios-safari
  return (
    <>
      <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
        <div className="bg-[#007DCA] px-6 pt-14 pb-7 text-center text-white">
          <img
            src={APP_ICON}
            alt=""
            className="mx-auto mb-[14px] h-[72px] w-[72px] rounded-[18px] shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
          />
          <h1 className="text-[22px] font-bold">건설인 앱 설치하기</h1>
          <p className="mt-[6px] text-sm opacity-85">홈 화면에 추가하면 앱처럼 바로 실행돼요</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-7">
          <div className="mb-5 overflow-hidden rounded-2xl bg-[#F8F8F8]">
            <Step num={1} icon={<Share size={26} className="text-[#007AFF]" />}>
              <div className="text-[15px] font-semibold leading-snug text-[#1C1C1E]">
                하단 <strong>공유 버튼</strong> 탭
              </div>
              <div className="mt-[3px] text-xs text-[#8E8E93]">화면 아래 중앙 네모+화살표 아이콘</div>
            </Step>
            <Step num={2} icon={<Plus size={26} className="text-[#007AFF]" />}>
              <div className="text-[15px] font-semibold leading-snug text-[#1C1C1E]">
                "<strong>홈 화면에 추가</strong>" 탭
              </div>
              <div className="mt-[3px] text-xs text-[#8E8E93]">목록을 아래로 스크롤하면 나타나요</div>
            </Step>
            <Step num={3} icon={<Check size={26} className="text-[#007AFF]" />}>
              <div className="text-[15px] font-semibold leading-snug text-[#1C1C1E]">
                우측 상단 "<strong>추가</strong>" 탭
              </div>
              <div className="mt-[3px] text-xs text-[#8E8E93]">홈 화면에 아이콘이 생겨요!</div>
            </Step>
          </div>

          <div className="mb-5 flex items-center gap-[10px] rounded-xl bg-[#EBF5FF] px-4 py-[14px] text-sm text-[#005BB5]">
            <Share size={22} />
            <span>
              공유 버튼은 Safari <strong>하단 메뉴 중앙</strong>에 있습니다
            </span>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="w-full rounded-[14px] bg-[#F2F2F7] px-4 py-[14px] text-[15px] text-[#8E8E93]"
          >
            나중에 설치할게요
          </button>
        </div>
      </div>

      {showArrow && (
        <div className="pointer-events-none fixed bottom-[52px] left-1/2 z-[10000] -translate-x-1/2 animate-bounce text-center">
          <div className="inline-block whitespace-nowrap rounded-full bg-[#FF3B30] px-4 py-[6px] text-[13px] font-bold text-white">
            여기를 탭하세요!
          </div>
          <br />
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF3B30" className="mt-1 inline-block">
            <path d="M12 21L3 9h18z" />
          </svg>
        </div>
      )}
    </>
  );
};

const Step = ({
  num,
  icon,
  children,
}: {
  num: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-4 px-4 py-[18px] [&+&]:border-t [&+&]:border-[#ECECEC]">
    <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-[#007DCA] text-sm font-bold text-white">
      {num}
    </div>
    <div className="flex w-[30px] flex-shrink-0 items-center justify-center text-2xl">{icon}</div>
    <div>{children}</div>
  </div>
);
