export function showInfoBox() {
    document.getElementById('infoContainer').classList.remove('hidden');
}

export function hideInfoBox() {
    document.getElementById('infoContainer').classList.add('hidden');
}

export function updateInfoBox(reportType, location, magnitude, depth, time, additionalInfo) {
    document.getElementById('reportType').textContent = reportType;
    document.getElementById('location').textContent = location;
    document.getElementById('magnitude').textContent = magnitude;
    document.getElementById('depth').textContent = depth;
    document.getElementById('time').textContent = time;
}