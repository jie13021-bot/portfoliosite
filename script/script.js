document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  const pages = document.querySelectorAll(".box");
  const total = pages.length;

  if (!container || !total) return;

  let index = 0;
  let locked = false;

  const DURATION = 1200;
  const THRESHOLD = 40;
  const mask = document.getElementById("mask");

  function pageW() {
    return document.documentElement.clientWidth; // 스크롤바 제외 실제 폭
  }

  // ✅ px 기반으로 쓰는 거면 width/percent transform 초기값은 통일하는 게 안전
  container.style.width = `${total * 100}%`;
  container.style.transform = `translateX(0px)`;

  function moveTo(i) {
    if (locked) return;
    if (i < 0 || i >= total) return;

    locked = true;

    if (mask) mask.classList.add("on");
    setTimeout(() => mask && mask.classList.remove("on"), 100);

    index = i;

    // ✅ px 기반 이동
    container.style.transform = `translateX(-${index * pageW()}px)`;

    setTimeout(() => {
      if (mask) mask.classList.remove("on");
      locked = false;
    }, DURATION);
  }

  // 리사이즈 시 현재 페이지 위치 재정렬
  window.addEventListener("resize", () => {
    container.style.transform = `translateX(-${index * pageW()}px)`;
  });

  // ✅ 경계에서 스크롤해도 움직이지 않도록 처리하는 공통 함수
  function handleWheelDelta(deltaY) {
    if (locked) return;
    if (Math.abs(deltaY) < THRESHOLD) return;

    const dir = deltaY > 0 ? 1 : -1;

    // ✅ 마지막 페이지에서 아래로 스크롤 / 첫 페이지에서 위로 스크롤 = 무시
    if (dir === 1 && index === total - 1) return;
    if (dir === -1 && index === 0) return;

    moveTo(index + dir);
  }

  window.addEventListener("wheel", (e) => {
    e.preventDefault();
    handleWheelDelta(e.deltaY); // ✅ 여기로 통일
  }, { passive: false });

  // ✅ 클릭 이동
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-go]");
    if (!a) return;
    e.preventDefault();

    const target = Number(a.dataset.go);
    if (!Number.isFinite(target)) return;
    moveTo(target);
  });

  // ✅ iframe -> 부모 메시지 처리
  window.addEventListener("message", (e) => {
    const data = e.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "WHEEL") {
      const dy = Number(data.deltaY);
      if (!Number.isFinite(dy)) return;
      handleWheelDelta(dy); // ✅ 여기로 통일
      return;
    }

    if (data.type === "GO") {
      const target = Number(data.idx);
      if (!Number.isFinite(target)) return;
      moveTo(target);
    }
    if (data.type === "STEP") {
  const step = Number(data.step);
  if (!Number.isFinite(step)) return;
  moveTo(index + step);  // ✅ 부모의 index가 갱신됨
  return;
}

  });
  // =========================
// Popup ONLY
// =========================
function setupPopup({
  popupId = "popup",
  dimId = "popupDim",
  frameId = "popupFrame",
  closeId = "popupClose",

  // 옵션 훅: 팝업 열고/닫을 때 외부 UI 제어가 필요하면 연결
  onOpen = null,   // () => void
  onClose = null,  // () => void

  // 옵션: 닫을 때 iframe src 비우기 여부
  clearFrameOnClose = true,
} = {}) {
  const popup = document.getElementById(popupId);
  const popupDim = document.getElementById(dimId);
  const popupFrame = document.getElementById(frameId);
  const popupClose = document.getElementById(closeId);

  const hasPopupUI = () => popup && popupDim && popupFrame;
  const isPopupOpen = () => hasPopupUI() && popup.classList.contains("show");

  // ✅ 팝업 열기 전 포커스 저장
  let lastFocusedEl = null;

  function lockScroll() {
    document.documentElement.classList.add("no-scroll");
    document.body.classList.add("no-scroll");
  }

  function unlockScroll() {
    document.documentElement.classList.remove("no-scroll");
    document.body.classList.remove("no-scroll");
  }

  function openPopup(url) {
    if (!hasPopupUI() || !url) return;

    // ✅ 포커스 저장
    lastFocusedEl = document.activeElement;

    // ✅ 외부 훅(원래는 구슬 숨김 등)
    if (typeof onOpen === "function") onOpen();

    // ✅ iframe 로드
    popupFrame.src = url;

    // ✅ show로 열기
    popup.classList.add("show");
    popupDim.classList.add("show");
    popup.setAttribute("aria-hidden", "false");
    popupDim.setAttribute("aria-hidden", "false");

    // ✅ 뒤 스크롤 잠금
    lockScroll();

    // ✅ 닫기 버튼 포커스
    if (popupClose) popupClose.focus();
  }

  function closePopup({ returnFocus = true } = {}) {
    if (!hasPopupUI()) return;

    // ✅ show로 닫기
    popup.classList.remove("show");
    popupDim.classList.remove("show");
    popup.setAttribute("aria-hidden", "true");
    popupDim.setAttribute("aria-hidden", "true");

    // ✅ 뒤 스크롤 해제
    unlockScroll();

    // ✅ iframe 비우기
    if (clearFrameOnClose) popupFrame.src = "";

    // ✅ 외부 훅(원래는 구슬 복구 등)
    if (typeof onClose === "function") onClose();

    // ✅ 포커스 복귀
    if (returnFocus && lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
      lastFocusedEl = null;
    }
  }

  // 이벤트 바인딩
  if (popupClose) popupClose.addEventListener("click", () => closePopup());
  if (popupDim) popupDim.addEventListener("click", () => closePopup());

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isPopupOpen()) closePopup();
  });

  // 외부에서 사용하도록 함수 반환
  return {
    openPopup,
    closePopup,
    isPopupOpen,
  };
}

});
