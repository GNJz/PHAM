// 게시물 시스템 - Phase 1
class PostSystem {
    constructor() {
        this.currentSection = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.attachEventListeners();
        });
    }

    attachEventListeners() {
        // 이과 모드 링크 찾기 (기존 HTML 구조에 맞게 조정)
        const memo1Links = document.querySelectorAll('a[data-section="memo_1"]');
        
        memo1Links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('memo1');
            });
        });
    }

    async showSection(sectionName) {
        // 다른 섹션들 숨기기
        this.hideAllSections();
        
        // 해당 섹션 보이기
        const container = document.getElementById(`${sectionName}-posts`);
        if (container) {
            container.style.display = 'block';
            await this.loadPosts(sectionName);
        }
    }

    hideAllSections() {
        const allContainers = document.querySelectorAll('[id$="-posts"]');
        allContainers.forEach(container => {
            container.style.display = 'none';
        });
    }

    async loadPosts(sectionName) {
        const container = document.getElementById(`${sectionName}-posts`);
        const loading = document.getElementById('loading');
        
        try {
            loading.textContent = '게시물을 불러오는 중...';
            
            const response = await fetch(`./data/${sectionName}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const posts = await response.json();
            this.renderPosts(posts, container);
            
        } catch (error) {
            console.error('게시물 로딩 실패:', error);
            loading.textContent = '게시물을 불러올 수 없습니다.';
        }
    }

    renderPosts(posts, container) {
        container.innerHTML = '<h2>이과 모드</h2>';
        
        posts.forEach(post => {
            const postElement = this.createPostElement(post);
            container.appendChild(postElement);
        });
    }

    createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'post-card';
        postDiv.style.cssText = `
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            padding: 20px;
            margin: 15px 0;
            background: #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s ease;
        `;

        // 호버 효과
        postDiv.addEventListener('mouseenter', () => {
            postDiv.style.transform = 'translateY(-2px)';
            postDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
        postDiv.addEventListener('mouseleave', () => {
            postDiv.style.transform = 'translateY(0)';
            postDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        });

        let contentHTML = `
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 1.4em;">${post.title}</h3>
            <div class="post-content" style="white-space: pre-wrap; line-height: 1.6; color: #555; margin: 15px 0;">
                ${this.formatContent(post.content, post.type)}
            </div>
        `;

        // 이미지가 있는 경우
        if (post.images && post.images.length > 0) {
            contentHTML += '<div class="post-images" style="margin: 15px 0;">';
            post.images.forEach(imagePath => {
                contentHTML += `<img src="./images/${imagePath}" alt="게시물 이미지" style="max-width: 100%; height: auto; border-radius: 8px; margin: 5px 0;">`;
            });
            contentHTML += '</div>';
        }

        contentHTML += `
            <div class="post-meta" style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; font-size: 0.9em; color: #888;">
                <span>📅 ${post.date}</span>
                <span style="margin-left: 10px;">📝 ${post.type === 'long' ? '긴 글' : '짧은 글'}</span>
            </div>
        `;

        postDiv.innerHTML = contentHTML;
        return postDiv;
    }

    formatContent(content, type) {
        if (type === 'long' && content.length > 200) {
            const preview = content.substring(0, 200) + '...';
            return `
                <div class="content-preview">${preview}</div>
                <div class="content-full" style="display: none;">${content}</div>
                <button class="expand-btn" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; margin-top: 10px;" onclick="this.previousElementSibling.style.display='block'; this.previousElementSibling.previousElementSibling.style.display='none'; this.style.display='none';">더 읽기</button>
            `;
        }
        return content;
    }
}

// 시스템 초기화
const postSystem = new PostSystem();
