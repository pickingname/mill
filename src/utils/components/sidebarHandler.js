const sidebar = document.getElementById("sidebar");
const dragHandle = document.getElementById("drag-handle");
const mapContainer = document.getElementById("map-container");

if (sidebar && dragHandle && mapContainer && map) {
  let isDragging = false;
  let startY = 0;
  let startHeight = 190;
  const minHeight = 190;
  const snapThreshold = 25;

  const handlePointerDown = (e) => {
    if (window.getComputedStyle(dragHandle).display === "none") return;

    if (e.target !== dragHandle) {
      const style = window.getComputedStyle(sidebar);
      const isScrollable = sidebar.scrollHeight > sidebar.clientHeight;
      if (isScrollable && style.overflowY === "auto") {
        return;
      }
    }

    e.preventDefault();
    dragHandle.setPointerCapture(e.pointerId);

    isDragging = true;
    startY = e.clientY;
    startHeight = sidebar.offsetHeight;
    sidebar.style.transition = "none";
    dragHandle.style.cursor = "grabbing";
    document.body.style.cursor = "grabbing";
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;

    const currentY = e.clientY;
    const deltaY = startY - currentY;
    let newHeight = startHeight + deltaY;

    const maxHeight = Math.min(
      window.innerHeight * 0.8,
      window.innerHeight - 100
    );
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

    sidebar.style.height = `${newHeight}px`;
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;

    dragHandle.releasePointerCapture(e.pointerId);
    isDragging = false;
    sidebar.style.transition = "";
    dragHandle.style.cursor = "grab";
    document.body.style.cursor = "";

    const currentHeight = sidebar.offsetHeight;
    const deltaFromStart = Math.abs(currentHeight - startHeight);

    if (deltaFromStart > snapThreshold) {
      if (currentHeight > startHeight) {
        const maxHeight = Math.min(
          window.innerHeight * 0.8,
          window.innerHeight - 100
        );
        sidebar.style.height = `${Math.min(
          maxHeight,
          sidebar.scrollHeight + 20
        )}px`;
      } else {
        sidebar.style.height = `${minHeight}px`;
      }
    } else {
      sidebar.style.height = `${startHeight}px`;
    }
  };

  const handleResize = () => {
    if (window.innerWidth >= 768) {
      sidebar.style.height = "auto";
      sidebar.style.transition = "";
    } else {
      const currentHeight = sidebar.offsetHeight;
      if (currentHeight <= minHeight) {
        sidebar.style.height = `${minHeight}px`;
      }
    }
  };

  dragHandle.addEventListener("pointerdown", handlePointerDown);
  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("resize", handleResize);

  handleResize();

  setTimeout(() => {}, 100);
} else {
  console.error(
    "[sidebarH] sidebar, drag handle, map container, or map instance not found."
  );
}

let sidebarHeightUsage = 0;
export function showSidebar() {
  const dragHandle = document.getElementById("drag-handle");
  if (!dragHandle || window.getComputedStyle(dragHandle).display === "none") {
    return;
  }

  if (!sidebar) {
    console.error("[sidebarH] sidebar not found");
    return;
  }

  if (sidebar.offsetHeight >= 190) {
    sidebarHeightUsage++;
    return;
  }

  if (sidebarHeightUsage === 0) {
    const maxHeight = Math.min(
      window.innerHeight * 0.8,
      window.innerHeight - 100
    );
    const targetHeight = Math.min(190, maxHeight);
    sidebar.style.height = targetHeight + "px";
    sidebarHeightUsage++;
  }
}
