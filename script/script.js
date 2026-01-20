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

  container.style.width = `${total * 100}%`;
  container.style.transform = `translateX(-${index * (100 / total)}%)`;

function pageW() {
  return document.documentElement.clientWidth; // 스크롤바 제외 실제 폭
}

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


  window.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (locked) return;
    if (Math.abs(e.deltaY) < THRESHOLD) return;

    if (e.deltaY > 0) moveTo(index + 1);
    else moveTo(index - 1);
  }, { passive: false });

  // ✅ 부모의 클릭은 postMessage 말고 직접 이동
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-go]");
    if (!a) return;
    e.preventDefault();

    const target = Number(a.dataset.go);
    if (!Number.isFinite(target)) return;
    moveTo(target);
  });

  // ✅ iframe -> 부모 메시지만 처리
  window.addEventListener("message", (e) => {
    const data = e.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "WHEEL") {
      if (locked) return;
      const dy = Number(data.deltaY);
      if (!Number.isFinite(dy)) return;
      if (Math.abs(dy) < THRESHOLD) return;

      if (dy > 0) moveTo(index + 1);
      else moveTo(index - 1);
      return;
    }

    if (data.type === "GO") {
      const target = Number(data.idx);
      if (!Number.isFinite(target)) return;
      moveTo(target);
    }
  });
});
