// DOM Elements
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseBtn');
        const dropArea = document.getElementById('dropArea');
        const qualitySlider = document.getElementById('qualitySlider');
        const widthSlider = document.getElementById('widthSlider');
        const heightSlider = document.getElementById('heightSlider');
        const qualityValue = document.getElementById('qualityValue');
        const widthValue = document.getElementById('widthValue');
        const heightValue = document.getElementById('heightValue');
        const previewImage = document.getElementById('previewImage');
        const previewContainer = document.getElementById('previewContainer');
        const originalSize = document.getElementById('originalSize');
        const compressedSize = document.getElementById('compressedSize');
        const reduction = document.getElementById('reduction');
        const downloadBtn = document.getElementById('downloadBtn');
        const copyBtn = document.getElementById('copyBtn');
        const notification = document.getElementById('notification');

        // State
        let originalFile = null;
        let compressedDataUrl = null;
        let compressedBlob = null;

        // Initialize from localStorage
        window.addEventListener('DOMContentLoaded', () => {
            const savedQuality = localStorage.getItem('imageQuality');
            const savedWidth = localStorage.getItem('imageMaxWidth');
            const savedHeight = localStorage.getItem('imageMaxHeight');

            if (savedQuality) {
                qualitySlider.value = savedQuality;
                qualityValue.textContent = savedQuality;
            }

            if (savedWidth) {
                widthSlider.value = savedWidth;
                widthValue.textContent = savedWidth;
            }

            if (savedHeight) {
                heightSlider.value = savedHeight;
                heightValue.textContent = savedHeight;
            }
        });

        // Event Listeners
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '#4361ee';
            dropArea.style.backgroundColor = '#f0f5ff';
        });
        dropArea.addEventListener('dragleave', () => {
            dropArea.style.borderColor = '#d1d5db';
            dropArea.style.backgroundColor = '#f9fafb';
        });
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '#d1d5db';
            dropArea.style.backgroundColor = '#f9fafb';
            
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFileSelect();
            }
        });

        qualitySlider.addEventListener('input', () => {
            qualityValue.textContent = qualitySlider.value;
            localStorage.setItem('imageQuality', qualitySlider.value);
            if (originalFile) compressImage();
        });

        widthSlider.addEventListener('input', () => {
            widthValue.textContent = widthSlider.value;
            localStorage.setItem('imageMaxWidth', widthSlider.value);
            if (originalFile) compressImage();
        });

        heightSlider.addEventListener('input', () => {
            heightValue.textContent = heightSlider.value;
            localStorage.setItem('imageMaxHeight', heightSlider.value);
            if (originalFile) compressImage();
        });

        downloadBtn.addEventListener('click', downloadImage);
        copyBtn.addEventListener('click', copyToClipboard);

        // Functions
        function handleFileSelect() {
            if (fileInput.files.length === 0) return;
            
            originalFile = fileInput.files[0];
            const fileSizeKB = Math.round(originalFile.size / 1024);
            originalSize.textContent = `${fileSizeKB} KB`;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.classList.remove('hidden');
                previewImage.src = e.target.result;
                previewContainer.querySelector('.placeholder-text').classList.add('hidden');
                compressImage();
            };
            reader.readAsDataURL(originalFile);
        }

        function compressImage() {
            if (!originalFile) return;
            
            const maxWidth = parseInt(widthSlider.value);
            const maxHeight = parseInt(heightSlider.value);
            const quality = parseInt(qualitySlider.value) / 100;
            
            const img = new Image();
            img.src = URL.createObjectURL(originalFile);
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions while maintaining aspect ratio
                if (width > maxWidth) {
                    height = height * (maxWidth / width);
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = width * (maxHeight / height);
                    height = maxHeight;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Get compressed image data
                compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                compressedBlob = dataURLToBlob(compressedDataUrl);
                
                // Update preview
                previewImage.src = compressedDataUrl;
                
                // Update file info
                const compressedSizeKB = Math.round(compressedBlob.size / 1024);
                compressedSize.textContent = `${compressedSizeKB} KB`;
                
                const originalSizeKB = Math.round(originalFile.size / 1024);
                const reductionPercent = Math.round(((originalSizeKB - compressedSizeKB) / originalSizeKB) * 100);
                reduction.textContent = `${reductionPercent}%`;
                
                // Enable buttons
                downloadBtn.disabled = false;
                copyBtn.disabled = false;
                
                URL.revokeObjectURL(img.src);
            };
        }

        function dataURLToBlob(dataUrl) {
            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            
            return new Blob([u8arr], { type: mime });
        }

        function downloadImage() {
            if (!compressedBlob) return;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(compressedBlob);
            link.download = `compressed-${originalFile.name.replace(/\.[^/.]+$/, "")}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function copyToClipboard() {
            if (!compressedBlob) return;
            
            navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': compressedBlob
                })
            ]).then(() => {
                showNotification('Image copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy image: ', err);
                showNotification('Failed to copy image');
            });
        }

        function showNotification(message) {
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }