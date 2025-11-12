class ImageGallery {
    constructor(containerId, imageId, prefix = 'g') {
        this.images = [];
        this.currentIndex = 0;
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.prefix = prefix;
        this.isLastImage = false;
        
        this.imageContainer = document.getElementById(containerId);
        this.currentImage = document.getElementById(imageId);
        
        this.init();
    }
    
    async init() {
        await this.loadImages();
        if (this.images.length > 0) {
            this.displayImage(0);
            this.isLastImage = (this.images.length === 1);
            this.setupScrollListener();
        } else {
            this.showError('이미지 파일을 찾을 수 없습니다.');
        }
    }
    
    async loadImages() {
        // 이미지 파일 확장자 목록
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        // prefix_숫자 형식의 이미지 파일 찾기 (g_001.jpg, h_001.png 등)
        // 숫자는 3자리로 패딩됩니다 (001, 002, 003...)
        
        const imagePromises = [];
        const maxFiles = 1000; // 최대 1000개까지 검색
        
        for (let i = 1; i <= maxFiles; i++) {
            const numStr = String(i).padStart(3, '0');
            for (const ext of extensions) {
                const filename = `${this.prefix}_${numStr}.${ext}`;
                imagePromises.push(this.checkImageExists(filename, i));
            }
        }
        
        const results = await Promise.all(imagePromises);
        const foundImages = results
            .filter(result => result.exists)
            .sort((a, b) => a.number - b.number);
        
        this.images = foundImages.map(result => result.filename);
    }
    
    async checkImageExists(filename, number) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ exists: true, filename, number });
            img.onerror = () => resolve({ exists: false, filename, number });
            img.src = filename;
        });
    }
    
    setupScrollListener() {
        let lastScrollTime = 0;
        const scrollDelay = 150; // 스크롤 간 최소 간격 (ms)
        
        this.imageContainer.addEventListener('wheel', (e) => {
            // 마지막 이미지이고 스크롤 다운이면 페이지 스크롤 허용
            if (this.isLastImage && e.deltaY > 0) {
                // 페이지 스크롤 허용
                return;
            }
            
            // 마지막 이미지가 아니거나 스크롤 업이면 기본 동작 방지
            e.preventDefault();
            
            const now = Date.now();
            if (now - lastScrollTime < scrollDelay) {
                return;
            }
            lastScrollTime = now;
            
            if (this.isScrolling) {
                return;
            }
            
            const delta = e.deltaY;
            
            if (delta > 0) {
                // 스크롤 다운 - 다음 이미지
                this.nextImage();
            } else {
                // 스크롤 업 - 이전 이미지
                this.prevImage();
            }
        }, { passive: false });
        
        // 마우스가 이미지 영역에 있을 때만 스크롤 작동
        this.imageContainer.addEventListener('mouseenter', () => {
            this.imageContainer.style.cursor = 'grab';
        });
        
        this.imageContainer.addEventListener('mouseleave', () => {
            this.imageContainer.style.cursor = 'default';
        });
    }
    
    nextImage() {
        if (this.currentIndex < this.images.length - 1) {
            this.currentIndex++;
            this.displayImage(this.currentIndex);
            this.isLastImage = (this.currentIndex === this.images.length - 1);
        } else {
            this.isLastImage = true;
        }
    }
    
    prevImage() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayImage(this.currentIndex);
            this.isLastImage = false;
        }
    }
    
    displayImage(index) {
        if (index < 0 || index >= this.images.length) {
            return;
        }
        
        this.isScrolling = true;
        this.imageContainer.classList.add('loading');
        
        const img = new Image();
        img.onload = () => {
            this.currentImage.src = this.images[index];
            this.currentImage.alt = `Image ${index + 1}`;
            this.imageContainer.classList.remove('loading');
            
            setTimeout(() => {
                this.isScrolling = false;
            }, 300);
        };
        
        img.onerror = () => {
            this.imageContainer.classList.remove('loading');
            this.isScrolling = false;
            console.error(`이미지를 로드할 수 없습니다: ${this.images[index]}`);
        };
        
        img.src = this.images[index];
    }
    
    showError(message) {
        this.imageContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p style="font-size: 18px; margin-bottom: 10px;">${message}</p>
                <p style="font-size: 14px; color: #999;">
                    이미지 파일명은 ${this.prefix}_숫자 형식이어야 합니다 (예: ${this.prefix}_001.jpg, ${this.prefix}_002.png)<br>
                    숫자는 3자리로 패딩되어야 합니다 (001, 002, 003...)<br>
                    이미지 파일들을 이 HTML 파일과 같은 폴더에 넣어주세요.
                </p>
            </div>
        `;
    }
}

// 자동 반복 재생 갤러리 클래스
class AutoImageGallery {
    constructor(containerId, imageId, prefix = 'h', interval = 100) {
        this.images = [];
        this.currentIndex = 0;
        this.prefix = prefix;
        this.interval = interval; // 이미지 전환 간격 (ms)
        this.animationId = null;
        
        this.imageContainer = document.getElementById(containerId);
        this.currentImage = document.getElementById(imageId);
        
        this.init();
    }
    
    async init() {
        await this.loadImages();
        if (this.images.length > 0) {
            this.displayImage(0);
            this.startAnimation();
        }
    }
    
    async loadImages() {
        // 이미지 파일 확장자 목록
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        // prefix_숫자 형식의 이미지 파일 찾기 (h_001.jpg, h_002.png 등)
        const imagePromises = [];
        const maxFiles = 1000;
        
        for (let i = 1; i <= maxFiles; i++) {
            const numStr = String(i).padStart(3, '0');
            for (const ext of extensions) {
                const filename = `${this.prefix}_${numStr}.${ext}`;
                imagePromises.push(this.checkImageExists(filename, i));
            }
        }
        
        const results = await Promise.all(imagePromises);
        const foundImages = results
            .filter(result => result.exists)
            .sort((a, b) => a.number - b.number);
        
        this.images = foundImages.map(result => result.filename);
    }
    
    async checkImageExists(filename, number) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ exists: true, filename, number });
            img.onerror = () => resolve({ exists: false, filename, number });
            img.src = filename;
        });
    }
    
    displayImage(index) {
        if (index < 0 || index >= this.images.length) {
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            this.currentImage.src = this.images[index];
            this.currentImage.alt = `Auto Image ${index + 1}`;
        };
        img.src = this.images[index];
    }
    
    startAnimation() {
        if (this.images.length === 0) return;
        
        let lastTime = 0;
        const animate = (currentTime) => {
            if (currentTime - lastTime >= this.interval) {
                this.currentIndex = (this.currentIndex + 1) % this.images.length;
                this.displayImage(this.currentIndex);
                lastTime = currentTime;
            }
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// 세 번째 갤러리 클래스 (i_숫자 자동 재생, 페이지가 보일 때마다 한 번만 재생)
class ThirdImageGallery {
    constructor(containerId, imageId, interval = 100) {
        this.iImages = [];
        this.currentIndex = 0;
        this.interval = interval;
        this.animationId = null;
        this.hasPlayed = false; // 한 번 재생했는지 추적
        
        this.imageContainer = document.getElementById(containerId);
        this.currentImage = document.getElementById(imageId);
        
        this.init();
    }
    
    async init() {
        await this.loadImages();
        if (this.iImages.length > 0) {
            this.displayImage(this.iImages[0], 0, 'i');
            this.setupIntersectionObserver();
        }
    }
    
    async loadImages() {
        const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const maxFiles = 1000;
        
        // i_숫자 파일 로드
        const iPromises = [];
        for (let i = 1; i <= maxFiles; i++) {
            const numStr = String(i).padStart(3, '0');
            for (const ext of extensions) {
                const filename = `i_${numStr}.${ext}`;
                iPromises.push(this.checkImageExists(filename, i, 'i'));
            }
        }
        
        const iResults = await Promise.all(iPromises);
        
        const foundIImages = iResults
            .filter(result => result.exists)
            .sort((a, b) => a.number - b.number);
        
        this.iImages = foundIImages.map(result => result.filename);
    }
    
    async checkImageExists(filename, number, type) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ exists: true, filename, number, type });
            img.onerror = () => resolve({ exists: false, filename, number, type });
            img.src = filename;
        });
    }
    
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 페이지가 보이면 한 번만 재생
                    if (!this.hasPlayed && this.iImages.length > 0) {
                        this.hasPlayed = true;
                        this.startAnimation();
                    }
                } else {
                    // 페이지가 보이지 않으면 애니메이션 중지 및 재생 상태 리셋
                    this.stopAnimation();
                    this.hasPlayed = false;
                    this.currentIndex = 0;
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(this.imageContainer);
    }
    
    startAnimation() {
        if (this.iImages.length === 0) return;
        
        let lastTime = 0;
        this.currentIndex = 0;
        
        const animate = (currentTime) => {
            if (currentTime - lastTime >= this.interval) {
                if (this.currentIndex < this.iImages.length) {
                    this.displayImage(this.iImages[this.currentIndex], this.currentIndex, 'i');
                    this.currentIndex++;
                    lastTime = currentTime;
                } else {
                    // 모든 이미지 재생 완료 - 애니메이션 중지
                    this.stopAnimation();
                    return;
                }
            }
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    displayImage(src, index, type) {
        const img = new Image();
        img.onload = () => {
            this.currentImage.src = src;
            this.currentImage.alt = `${type.toUpperCase()} Image ${index + 1}`;
        };
        img.src = src;
    }
    
}

// 첫 번째 갤러리 sticky 제어
function setupStickyControl() {
    const firstGallery = document.getElementById('firstGallery');
    const thirdGallery = document.getElementById('thirdGallery');
    
    if (!firstGallery || !thirdGallery) return;
    
    function checkSticky() {
        const firstRect = firstGallery.getBoundingClientRect();
        const thirdRect = thirdGallery.getBoundingClientRect();
        
        // 세 번째 갤러리가 화면에 보이기 시작하면 첫 번째 갤러리의 sticky 해제
        if (thirdRect.top < window.innerHeight) {
            firstGallery.classList.add('no-sticky');
        } else {
            firstGallery.classList.remove('no-sticky');
        }
    }
    
    window.addEventListener('scroll', checkSticky);
    checkSticky(); // 초기 체크
}

// 페이지 로드 시 갤러리 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 첫 번째 갤러리 (g_숫자, 스크롤 제어)
    new ImageGallery('imageContainer', 'currentImage', 'g');
    
    // 두 번째 갤러리 (h_숫자, 자동 반복 재생, 100ms 간격)
    new AutoImageGallery('autoImageContainer', 'autoCurrentImage', 'h', 100);
    
    // 세 번째 갤러리 (i_숫자 자동 재생, 페이지가 보일 때마다 한 번만 재생)
    new ThirdImageGallery('thirdImageContainer', 'thirdCurrentImage', 100);
    
    // sticky 제어 설정
    setupStickyControl();
});

