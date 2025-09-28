document.addEventListener('DOMContentLoaded', function () {

    // --- DATA STORE ---
    // NOT: Görsel yolları, dosyaların ana klasörde olduğunu varsayarak basit tutulmuştur.
    const eserler = [
      { id: 1, title: "Bronz Papağan", lat: 52.5200, lng: 13.4050, 
        bulunduguUlke: "Almanya", bulunduguSehir: "Berlin", museum: "Pergamon Müzesi", 
        aitOlduguSehir: "Samsun", aitOlduguUlke: "Türkiye", iadeTalebi: "Var", 
        image: "eser1.jpg", description: "Samsun'dan kaçırılan bu nadir eser, yasa dışı yollarla yurt dışına çıkarılmıştır. Amacımız dijital iade farkındalığı yaratmaktır." },
      
      { id: 2, title: "Deneme 1", lat: 51.5195, lng: -0.1269, 
        bulunduguUlke: "İngiltere", bulunduguSehir: "Londra", museum: "British Museum", 
        aitOlduguSehir: "İzmir", aitOlduguUlke: "Türkiye", iadeTalebi: "Yok", 
        image: "eser2.jpg", description: "Bu eserin iade süreci için çalışmalar devam etmekte olup, henüz bir sonuç alınamamıştır." },
      
      { id: 3, title: "Deneme 2", lat: 48.8606, lng: 2.3376, 
        bulunduguUlke: "Fransa", bulunduguSehir: "Paris", museum: "Louvre Müzesi", 
        aitOlduguSehir: "İstanbul", aitOlduguUlke: "Türkiye", iadeTalebi: "Var", 
        image: "eser3.jpg", description: "Uzun süren diplomatik görüşmeler sonucunda bu değerli eser ait olduğu topraklara geri kazandırılmıştır." }
    ];

    // --- MAP INITIALIZATION & STATE ---
    let map;
    let allMarkers = [];

    function initMap() {
        if (map) { map.remove(); }
        map = L.map('map', { zoomControl: false }).setView([eserler[0].lat, eserler[0].lng], 5);
        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        setTimeout(() => map.invalidateSize(), 100);

        createMarkers();
        populateFilters();
        setupEventListeners();
    }

    // --- MARKER & POPUP CREATION (KRİTİK DÜZELTME BURADA) ---
    function createMarkers() {
        allMarkers.forEach(m => m.marker.remove());
        allMarkers = [];

        eserler.forEach(eser => {
            const statusClass = eser.iadeTalebi === 'Var' ? 'iade-var' : 'iade-yok';
            const imagePath = eser.image; 

            // POP-UP İÇERİĞİ DÜZELTİLDİ: Tüm detaylar ayrı ayrı eklendi.
            const popupContent = `
                <img src="${imagePath}" alt="${eser.title}" class="popup-image">
                <h3>${eser.title}</h3>
                <p><strong>Bulunduğu Müze:</strong> ${eser.museum}</p>
                <p><strong>Bulunduğu Yer:</strong> ${eser.bulunduguSehir}, ${eser.bulunduguUlke}</p>
                <p><strong>Asıl Ait Olduğu Yer:</strong> ${eser.aitOlduguSehir}, ${eser.aitOlduguUlke}</p>
                <p><span class="${statusClass}">İade Talebi: ${eser.iadeTalebi}</span></p>
                <p class="popup-description">${eser.description}</p>
            `;

            const marker = L.marker([eser.lat, eser.lng], { title: eser.title });
            marker.bindPopup(popupContent);
            marker.addTo(map);
            allMarkers.push({ marker, data: eser });
        });
    }

    // --- UI EVENT LISTENERS ---
    function setupEventListeners() {
        document.getElementById('search-input').addEventListener('change', handleSearch);
        const modal = document.getElementById('filter-modal');
        document.getElementById('filter-icon').addEventListener('click', () => modal.classList.toggle('hidden'));
        map.on('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', e => e.stopPropagation());
        document.getElementById('apply-filter-btn').addEventListener('click', applyFilters);
        document.getElementById('reset-filter-btn').addEventListener('click', resetFilters);
    }
    
    // --- SEARCH FUNCTIONALITY ---
    function handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        if (!searchTerm) return;
        
        const found = allMarkers.find(item => 
            item.data.title.toLowerCase().includes(searchTerm) ||
            item.data.museum.toLowerCase().includes(searchTerm)
        );

        if (found) {
            map.flyTo(found.marker.getLatLng(), 15);
            found.marker.openPopup();
        } else {
            alert("Eser veya müze bulunamadı.");
        }
        event.target.value = '';
    }

    // --- FILTER FUNCTIONALITY ---
    function populateFilters() {
        const uniqueCountries = [...new Set(eserler.map(e => e.bulunduguUlke))].sort();
        const uniqueCities = [...new Set(eserler.map(e => e.aitOlduguSehir))].sort();
        document.getElementById('country-filter-container').innerHTML = uniqueCountries.map(c => `<div><input type="checkbox" id="country-${c}" value="${c}" class="country-checkbox"><label for="country-${c}">${c}</label></div>`).join('');
        document.getElementById('city-filter-container').innerHTML = uniqueCities.map(c => `<div><input type="checkbox" id="city-${c}" value="${c}" class="city-checkbox"><label for="city-${c}">${c}</label></div>`).join('');
    }

    function applyFilters() {
        const selectedCountries = Array.from(document.querySelectorAll('.country-checkbox:checked')).map(cb => cb.value);
        const selectedCities = Array.from(document.querySelectorAll('.city-checkbox:checked')).map(cb => cb.value);
        const selectedStatus = document.querySelector('input[name="returned_status"]:checked').value;
        const visibleMarkers = [];

        allMarkers.forEach(item => {
            const countryMatch = selectedCountries.length === 0 || selectedCountries.includes(item.data.bulunduguUlke);
            const cityMatch = selectedCities.length === 0 || selectedCities.includes(item.data.aitOlduguSehir);
            const statusMatch = selectedStatus === 'Tümü' || selectedStatus === item.data.iadeTalebi;
            if (countryMatch && cityMatch && statusMatch) {
                item.marker.addTo(map);
                visibleMarkers.push(item.marker);
            } else {
                item.marker.removeFrom(map);
            }
        });
        
        adjustMapView(visibleMarkers);
        document.getElementById('filter-modal').classList.add('hidden');
    }

    function resetFilters() {
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        document.getElementById('return-all').checked = true;
        const allMarkerInstances = allMarkers.map(item => {
            item.marker.addTo(map);
            return item.marker;
        });
        adjustMapView(allMarkerInstances);
        document.getElementById('filter-modal').classList.add('hidden');
    }

    function adjustMapView(markers) {
        if (markers.length === 0) return;
        if (markers.length === 1) {
            map.flyTo(markers[0].getLatLng(), 14);
        } else {
            const group = new L.featureGroup(markers);
            map.flyToBounds(group.getBounds().pad(0.2));
        }
    }

    // --- START THE APP ---
    initMap();
});