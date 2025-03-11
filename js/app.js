// 图片工具主应用

// 全局变量
let originalImage = null; // 原始图片对象
let processedImage = null; // 处理后的图片对象
let originalCanvas = document.getElementById('original-canvas');
let processedCanvas = document.getElementById('processed-canvas');
let originalCtx = originalCanvas.getContext('2d');
let processedCtx = processedCanvas.getContext('2d');
let currentZoom = 1; // 当前缩放级别
let imageHistory = []; // 操作历史
let historyIndex = -1; // 当前历史索引
let originalImageData = null; // 原始图片数据

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // 初始化上传功能
    initUpload();
    
    // 初始化编辑功能
    initCompression();
    initResizing();
    initFormatConversion();
    
    // 初始化预览控制
    initPreviewControls();
    
    // 初始化下载功能
    initDownload();
    
    // 初始化重置功能
    document.getElementById('reset-all').addEventListener('click', resetAllSettings);
}

// 上传功能
function initUpload() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const selectButton = document.getElementById('select-button');
    
    // 点击选择按钮触发文件选择
    selectButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 监听文件选择
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖放功能
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // 拖拽样式
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('highlight');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('highlight');
        }, false);
    });
    
    // 处理拖放文件
    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }, false);
}

// 处理文件选择
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
}

// 处理文件上传
function handleFile(file) {
    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
        alert('不支持的文件格式。请上传JPG、PNG、WebP、GIF或BMP格式的图片。');
        return;
    }
    
    // 检查文件大小
    if (file.size > 20 * 1024 * 1024) { // 20MB
        alert('文件过大。请上传小于20MB的图片。');
        return;
    }
    
    // 显示加载提示
    showLoading('加载图片中...');
    
    // 读取文件
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // 保存原始图片
            originalImage = img;
            originalImageData = e.target.result;
            
            // 初始化画布尺寸
            resetCanvasSize();
            
            // 绘制原始图片
            drawOriginalImage();
            
            // 初始化处理后图片（初始为原图的副本）
            processedImage = new Image();
            processedImage.src = originalImage.src;
            processedImage.onload = function() {
                // 绘制处理后图片
                drawProcessedImage();
                
                // 更新文件信息
                updateFileInfo();
                
                // 切换到编辑界面
                switchToEditMode();
                
                // 添加到历史记录
                addToHistory();
                
                // 隐藏加载提示
                hideLoading();
            };
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 重置画布尺寸
function resetCanvasSize() {
    // 设置画布尺寸为图片原始尺寸
    originalCanvas.width = originalImage.width;
    originalCanvas.height = originalImage.height;
    processedCanvas.width = originalImage.width;
    processedCanvas.height = originalImage.height;
    
    // 更新宽高输入框
    document.getElementById('width-input').value = originalImage.width;
    document.getElementById('height-input').value = originalImage.height;
}

// 绘制原始图片
function drawOriginalImage() {
    originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
    originalCtx.drawImage(originalImage, 0, 0, originalCanvas.width, originalCanvas.height);
}

// 绘制处理后图片
function drawProcessedImage() {
    processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
    processedCtx.drawImage(processedImage, 0, 0, processedCanvas.width, processedCanvas.height);
}

// 切换到编辑模式
function switchToEditMode() {
    // 更新步骤指示器
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index === 1) { // 编辑步骤
            step.classList.add('active');
        } else if (index === 0) { // 上传步骤
            step.classList.remove('active');
        }
    });
    
    // 隐藏上传容器，显示编辑容器
    document.getElementById('upload-container').classList.remove('active');
    document.getElementById('upload-container').classList.add('hidden');
    document.getElementById('edit-container').classList.remove('hidden');
    document.getElementById('edit-container').classList.add('active');
    
    // 更新当前格式显示
    updateCurrentFormat();
}

// 更新文件信息
function updateFileInfo() {
    // 显示原始文件大小
    const originalSize = getImageSize(originalImageData);
    document.getElementById('original-size').textContent = formatFileSize(originalSize);
    
    // 获取处理后图片大小
    getProcessedImageSize().then(size => {
        document.getElementById('compressed-size').textContent = formatFileSize(size);
        
        // 计算减少的大小
        const reduction = originalSize - size;
        const reductionPercent = (reduction / originalSize * 100).toFixed(1);
        document.getElementById('size-reduction').textContent = 
            `${formatFileSize(reduction)} (${reductionPercent}%)`;
        
        // 更新下载信息
        document.getElementById('final-size').textContent = formatFileSize(size);
    });
}

// 获取图片大小
function getImageSize(dataUrl) {
    // 对于base64数据，大致计算大小
    const base64 = dataUrl.split(',')[1];
    return Math.ceil((base64.length * 3) / 4);
}

// 获取处理后图片大小
async function getProcessedImageSize() {
    return new Promise(resolve => {
        const canvas = document.createElement('canvas');
        canvas.width = processedCanvas.width;
        canvas.height = processedCanvas.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(processedImage, 0, 0, canvas.width, canvas.height);
        
        // 获取当前选择的格式
        const format = document.getElementById('format-select').value;
        const quality = document.getElementById('quality-slider').value / 100;
        
        // 转换为blob以获取大小
        canvas.toBlob(blob => {
            resolve(blob.size);
        }, `image/${format}`, quality);
    });
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
    } else {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

// 压缩功能初始化
function initCompression() {
    const qualitySlider = document.getElementById('quality-slider');
    const qualityInput = document.getElementById('quality-input');
    const targetSizeInput = document.getElementById('target-size');
    const sizeUnitSelect = document.getElementById('size-unit');
    const applySizeButton = document.getElementById('apply-size');
    
    // 同步滑块和输入框
    qualitySlider.addEventListener('input', () => {
        qualityInput.value = qualitySlider.value;
        applyCompression();
    });
    
    qualityInput.addEventListener('input', () => {
        // 确保输入值在0-100之间
        let value = parseInt(qualityInput.value);
        if (isNaN(value)) value = 80;
        if (value < 0) value = 0;
        if (value > 100) value = 100;
        
        qualityInput.value = value;
        qualitySlider.value = value;
        applyCompression();
    });
    
    // 应用目标大小压缩
    applySizeButton.addEventListener('click', () => {
        const targetSize = parseInt(targetSizeInput.value);
        if (isNaN(targetSize) || targetSize <= 0) {
            alert('请输入有效的目标文件大小');
            return;
        }
        
        const unit = sizeUnitSelect.value;
        let targetBytes = targetSize;
        if (unit === 'KB') {
            targetBytes = targetSize * 1024;
        } else if (unit === 'MB') {
            targetBytes = targetSize * 1024 * 1024;
        }
        
        compressToTargetSize(targetBytes);
    });
}

// 应用压缩
function applyCompression() {
    if (!originalImage) return;
    
    showLoading('应用压缩中...');
    
    // 使用Web Worker进行压缩处理
    setTimeout(() => {
        const quality = document.getElementById('quality-slider').value / 100;
        const format = document.getElementById('format-select').value;
        
        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = processedCanvas.width;
        tempCanvas.height = processedCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(processedImage, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // 转换为新图片
        tempCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = function() {
                processedImage = img;
                drawProcessedImage();
                updateFileInfo();
                addToHistory();
                hideLoading();
            };
            img.src = url;
        }, `image/${format}`, quality);
    }, 100);
}

// 压缩到目标大小
async function compressToTargetSize(targetBytes) {
    if (!originalImage) return;
    
    showLoading('计算最佳压缩参数...');
    
    // 二分查找最佳质量值
    let minQuality = 0.01;
    let maxQuality = 1.0;
    let bestQuality = 0.8;
    let bestSize = Infinity;
    let iterations = 0;
    const maxIterations = 10; // 最大迭代次数
    
    const format = document.getElementById('format-select').value;
    
    while (iterations < maxIterations) {
        iterations++;
        const midQuality = (minQuality + maxQuality) / 2;
        
        // 更新进度条
        document.getElementById('progress-indicator').style.width = 
            `${(iterations / maxIterations) * 100}%`;
        
        // 使用当前质量值压缩
        const size = await compressAndGetSize(midQuality, format);
        
        // 更新最佳质量
        if (Math.abs(size - targetBytes) < Math.abs(bestSize - targetBytes)) {
            bestQuality = midQuality;
            bestSize = size;
        }
        
        // 调整搜索范围
        if (size > targetBytes) {
            maxQuality = midQuality;
        } else {
            minQuality = midQuality;
        }
        
        // 如果足够接近目标大小或达到最大迭代次数，退出循环
        if (Math.abs(size - targetBytes) / targetBytes < 0.05 || iterations >= maxIterations) {
            break;
        }
    }
    
    // 应用最佳质量值
    document.getElementById('quality-slider').value = Math.round(bestQuality * 100);
    document.getElementById('quality-input').value = Math.round(bestQuality * 100);
    applyCompression();
}

// 压缩并获取大小
async function compressAndGetSize(quality, format) {
    return new Promise(resolve => {
        const canvas = document.createElement('canvas');
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(blob => {
            resolve(blob.size);
        }, `image/${format}`, quality);
    });
}

// 尺寸调整功能初始化
function initResizing() {
    const widthInput = document.getElementById('width-input');
    const heightInput = document.getElementById('height-input');
    const lockAspectRatio = document.getElementById('lock-aspect-ratio');
    const resetSizeButton = document.getElementById('reset-size');
    const ratioButtons = document.querySelectorAll('.preset-ratios button');
    const canvasOption = document.getElementById('canvas-option');
    const bgColor = document.getElementById('bg-color');
    
    // 原始宽高比
    let aspectRatio = 1;
    
    // 初始化宽高比
    if (originalImage) {
        aspectRatio = originalImage.width / originalImage.height;
    }
    
    // 监听宽度变化
    widthInput.addEventListener('input', () => {
        if (lockAspectRatio.checked) {
            // 保持宽高比
            const width = parseInt(widthInput.value);
            if (!isNaN(width)) {
                heightInput.value = Math.round(width / aspectRatio);
            }
        }
        applyResize();
    });
    
    // 监听高度变化
    heightInput.addEventListener('input', () => {
        if (lockAspectRatio.checked) {
            // 保持宽高比
            const height = parseInt(heightInput.value);
            if (!isNaN(height)) {
                widthInput.value = Math.round(height * aspectRatio);
            }
        }
        applyResize();
    });
    
    // 预设比例按钮
    ratioButtons.forEach(button => {
        button.addEventListener('click', () => {
            const ratio = button.getAttribute('data-ratio');
            const [width, height] = ratio.split(':').map(Number);
            
            // 计算新尺寸，保持原始面积
            const originalArea = originalImage.width * originalImage.height;
            const newRatio = width / height;
            
            const newWidth = Math.round(Math.sqrt(originalArea * newRatio));
            const newHeight = Math.round(newWidth / newRatio);
            
            widthInput.value = newWidth;
            heightInput.value = newHeight;
            
            applyResize();
        });
    });
    
    // 画布选项变化
    canvasOption.addEventListener('change', applyResize);
    bgColor.addEventListener('input', applyResize);
    
    // 重置尺寸
    resetSizeButton.addEventListener('click', () => {
        widthInput.value = originalImage.width;
        heightInput.value = originalImage.height;
        canvasOption.value = 'none';
        applyResize();
    });
}

// 应用尺寸调整
function applyResize() {
    if (!originalImage) return;
    
    showLoading('调整尺寸中...');
    
    setTimeout(() => {
        const width = parseInt(document.getElementById('width-input').value);
        const height = parseInt(document.getElementById('height-input').value);
        const canvasOption = document.getElementById('canvas-option').value;
        const bgColor = document.getElementById('bg-color').value;
        
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            hideLoading();
            return;
        }
        
        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 填充背景色或透明背景
        if (canvasOption === 'fill') {
            tempCtx.fillStyle = bgColor;
            tempCtx.fillRect(0, 0, width, height);
        } else if (canvasOption === 'transparent') {
            tempCtx.clearRect(0, 0, width, height);
        }
        
        // 计算居中位置
        const x = (width - originalImage.width) / 2;
        const y = (height - originalImage.height) / 2;
        
        // 绘制调整后的图片
        if (canvasOption === 'none') {
            // 直接缩放图片
            tempCtx.drawImage(originalImage, 0, 0, width, height);
        } else {
            // 在画布中居中绘制原始图片
            const scale = Math.min(width / originalImage.width, height / originalImage.height);
            const scaledWidth = originalImage.width * scale;
            const scaledHeight = originalImage.height * scale;
            const offsetX = (width - scaledWidth) / 2;
            const offsetY = (height - scaledHeight) / 2;
            
            tempCtx.drawImage(originalImage, offsetX, offsetY, scaledWidth, scaledHeight);
        }
        
        // 更新处理后的图片
        tempCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = function() {
                processedImage = img;
                processedCanvas.width = width;
                processedCanvas.height = height;
                drawProcessedImage();
                updateFileInfo();
                addToHistory();
                hideLoading();
            };
            img.src = url;
        }, 'image/png');
    }, 100);
}

// 格式转换功能初始化
function initFormatConversion() {
    const formatSelect = document.getElementById('format-select');
    const jpegOptions = document.getElementById('jpeg-options');
    const pngOptions = document.getElementById('png-options');
    
    // 监听格式变化
    formatSelect.addEventListener('change', () => {
        const format = formatSelect.value;
        
        // 显示/隐藏相应的格式选项
        if (format === 'jpeg' || format === 'webp') {
            jpegOptions.classList.remove('hidden');
            pngOptions.classList.add('hidden');
        } else if (format === 'png') {
            jpegOptions.classList.add('hidden');
            pngOptions.classList.remove('hidden');
        } else {
            jpegOptions.classList.add('hidden');
            pngOptions.classList.add('hidden');
        }
        
        // 更新格式信息
        document.getElementById('final-format').textContent = format.toUpperCase();
        
        // 应用格式转换
        applyFormatConversion();
    });
    
    // 监听选项变化
    document.getElementById('keep-exif').addEventListener('change', applyFormatConversion);
    document.getElementById('keep-transparency').addEventListener('change', applyFormatConversion);
}

// 应用格式转换
function applyFormatConversion() {
    if (!originalImage) return;
    
    showLoading('转换格式中...');
    
    setTimeout(() => {
        const format = document.getElementById('format-select').value;
        const quality = document.getElementById('quality-slider').value / 100;
        const keepTransparency = document.getElementById('keep-transparency').checked;
        
        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = processedCanvas.width;
        tempCanvas.height = processedCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 处理透明度
        if (format === 'jpeg' && !keepTransparency) {
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
        
        // 绘制图片
        tempCtx.drawImage(processedImage, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // 转换为新格式
        tempCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = function() {
                processedImage = img;
                drawProcessedImage();
                updateFileInfo();
                updateCurrentFormat();
                addToHistory();
                hideLoading();
            };
            img.src = url;
        }, `image/${format}`, quality);
    }, 100);
}

// 更新当前格式显示
function updateCurrentFormat() {
    if (!originalImage) return;
    
    // 获取原始图片格式
    let originalFormat = 'unknown';
    if (originalImageData.includes('data:image/jpeg')) {
        originalFormat = 'JPEG';
    } else if (originalImageData.includes('data:image/png')) {
        originalFormat = 'PNG';
    } else if (originalImageData.includes('data:image/webp')) {
        originalFormat = 'WebP';
    } else if (originalImageData.includes('data:image/gif')) {
        originalFormat = 'GIF';
    } else if (originalImageData.includes('data:image/bmp')) {
        originalFormat = 'BMP';
    }
    
    document.getElementById('current-format').textContent = originalFormat;
    
    // 更新最终格式显示
    const targetFormat = document.getElementById('format-select').value.toUpperCase();
    document.getElementById('final-format').textContent = targetFormat;
}

// 预览控制功能初始化
function initPreviewControls() {
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomFitBtn = document.getElementById('zoom-fit');
    const zoomLevelDisplay = document.getElementById('zoom-level');
    const splitViewBtn = document.getElementById('split-view');
    const singleViewBtn = document.getElementById('single-view');
    const previewWrapper = document.querySelector('.preview-wrapper');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    // 缩放控制
    zoomInBtn.addEventListener('click', () => {
        currentZoom = Math.min(currentZoom * 1.2, 5); // 最大放大5倍
        applyZoom();
    });
    
    zoomOutBtn.addEventListener('click', () => {
        currentZoom = Math.max(currentZoom / 1.2, 0.1); // 最小缩小到0.1倍
        applyZoom();
    });
    
    zoomFitBtn.addEventListener('click', () => {
        currentZoom = 1;
        applyZoom();
    });
    
    // 视图模式切换
    splitViewBtn.addEventListener('click', () => {
        splitViewBtn.classList.add('active');
        singleViewBtn.classList.remove('active');
        previewWrapper.classList.add('split-mode');
        previewWrapper.classList.remove('single-mode');
    });
    
    singleViewBtn.addEventListener('click', () => {
        singleViewBtn.classList.add('active');
        splitViewBtn.classList.remove('active');
        previewWrapper.classList.add('single-mode');
        previewWrapper.classList.remove('split-mode');
    });
    
    // 历史记录控制
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
}

// 应用缩放
function applyZoom() {
    const zoomLevelDisplay = document.getElementById('zoom-level');
    zoomLevelDisplay.textContent = `${Math.round(currentZoom * 100)}%`;
    
    // 应用缩放到画布
    const originalCanvas = document.getElementById('original-canvas');
    const processedCanvas = document.getElementById('processed-canvas');
    
    originalCanvas.style.transform = `scale(${currentZoom})`;
    processedCanvas.style.transform = `scale(${currentZoom})`;
}

// 添加到历史记录
function addToHistory() {
    // 如果当前不是最新状态，删除后面的历史记录
    if (historyIndex < imageHistory.length - 1) {
        imageHistory = imageHistory.slice(0, historyIndex + 1);
    }
    
    // 创建当前状态的副本
    const currentState = {
        width: processedCanvas.width,
        height: processedCanvas.height,
        dataURL: processedCanvas.toDataURL()
    };
    
    // 添加到历史记录
    imageHistory.push(currentState);
    historyIndex = imageHistory.length - 1;
    
    // 更新撤销/重做按钮状态
    updateHistoryButtons();
}

// 更新历史按钮状态
function updateHistoryButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= imageHistory.length - 1;
}

// 撤销操作
function undo() {
    if (historyIndex <= 0) return;
    
    historyIndex--;
    restoreFromHistory();
}

// 重做操作
function redo() {
    if (historyIndex >= imageHistory.length - 1) return;
    
    historyIndex++;
    restoreFromHistory();
}

// 从历史记录恢复
function restoreFromHistory() {
    const state = imageHistory[historyIndex];
    
    // 恢复画布尺寸
    processedCanvas.width = state.width;
    processedCanvas.height = state.height;
    
    // 恢复图像数据
    const img = new Image();
    img.onload = function() {
        processedImage = img;
        drawProcessedImage();
        updateFileInfo();
        
        // 更新宽高输入框
        document.getElementById('width-input').value = state.width;
        document.getElementById('height-input').value = state.height;
        
        // 更新历史按钮状态
        updateHistoryButtons();
    };
    img.src = state.dataURL;
}

// 下载功能初始化
function initDownload() {
    const downloadBtn = document.getElementById('download-btn');
    
    downloadBtn.addEventListener('click', () => {
        if (!processedImage) return;
        
        showLoading('准备下载...');
        
        setTimeout(() => {
            // 获取当前选择的格式
            const format = document.getElementById('format-select').value;
            const quality = document.getElementById('quality-slider').value / 100;
            const keepExif = document.getElementById('keep-exif').checked;
            
            // 创建下载画布
            const downloadCanvas = document.createElement('canvas');
            downloadCanvas.width = processedCanvas.width;
            downloadCanvas.height = processedCanvas.height;
            const ctx = downloadCanvas.getContext('2d');
            ctx.drawImage(processedImage, 0, 0, downloadCanvas.width, downloadCanvas.height);
            
            // 处理EXIF数据（简化实现，实际需要使用专门的库）
            let mimeType = `image/${format}`;
            if (format === 'jpeg') {
                mimeType = 'image/jpeg';
            }
            
            // 转换为Blob并下载
            downloadCanvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                
                // 生成文件名
                const originalFileName = 'image'; // 实际应用中可从原始文件名获取
                const extension = format === 'jpeg' ? 'jpg' : format;
                const fileName = `${originalFileName}_processed.${extension}`;
                
                a.href = url;
                a.download = fileName;
                a.click();
                
                // 释放URL对象
                setTimeout(() => URL.revokeObjectURL(url), 100);
                
                // 更新步骤指示器
                document.querySelectorAll('.step').forEach((step, index) => {
                    if (index === 2) { // 导出步骤
                        step.classList.add('active');
                    }
                });
                
                hideLoading();
            }, mimeType, quality);
        }, 100);
    });
}

// 重置所有设置
function resetAllSettings() {
    if (!originalImage) return;
    
    showLoading('重置设置中...');
    
    setTimeout(() => {
        // 重置压缩设置
        document.getElementById('quality-slider').value = 80;
        document.getElementById('quality-input').value = 80;
        document.getElementById('target-size').value = '';
        
        // 重置尺寸设置
        document.getElementById('width-input').value = originalImage.width;
        document.getElementById('height-input').value = originalImage.height;
        document.getElementById('lock-aspect-ratio').checked = true;
        document.getElementById('canvas-option').value = 'none';
        
        // 重置格式设置
        document.getElementById('format-select').value = 'jpeg';
        document.getElementById('keep-exif').checked = true;
        document.getElementById('keep-transparency').checked = true;
        
        // 显示相应的格式选项
        document.getElementById('jpeg-options').classList.remove('hidden');
        document.getElementById('png-options').classList.add('hidden');
        
        // 重置处理后的图片为原图
        processedImage = new Image();
        processedImage.onload = function() {
            // 重置画布尺寸
            processedCanvas.width = originalImage.width;
            processedCanvas.height = originalImage.height;
            
            // 绘制处理后图片
            drawProcessedImage();
            
            // 更新文件信息
            updateFileInfo();
            
            // 更新当前格式显示
            updateCurrentFormat();
            
            // 添加到历史记录
            addToHistory();
            
            hideLoading();
        };
        processedImage.src = originalImage.src;
    }, 100);
}

// 显示加载提示
function showLoading(message = '处理中...') {
    document.getElementById('loading-overlay').classList.remove('hidden');
    document.getElementById('loading-text').textContent = message;
    document.getElementById('progress-indicator').style.width = '0%';
}

// 隐藏加载提示
function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}