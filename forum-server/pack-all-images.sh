#!/bin/bash
# 打包所有Docker镜像
# 作者: ZhiHuClone论坛系统
# 日期: 2025-05-20

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 创建输出目录
mkdir -p ./docker-images

# 要打包的镜像列表
images=(
    "forum-server-api:latest"
    "postgres:14-alpine"
    "redis:7-alpine"
    "dpage/pgadmin4:latest"
    "nginx:alpine"
)

# 显示进度
echo -e "${YELLOW}开始打包所有Docker镜像...${NC}"
echo -e "${YELLOW}这个过程可能需要几分钟，取决于镜像大小...${NC}"

# 确保所有镜像都已下载
for image in "${images[@]}"; do
    if docker image inspect "$image" &>/dev/null; then
        echo -e "${GREEN}镜像 $image 已存在，将打包${NC}"
    else
        echo -e "${YELLOW}镜像 $image 不存在，尝试拉取...${NC}"
        docker pull "$image"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}无法拉取镜像 $image，可能需要构建本地镜像${NC}"
            
            # 如果是API镜像，尝试构建
            if [ "$image" = "forum-server-api:latest" ]; then
                echo -e "${YELLOW}尝试构建论坛API镜像...${NC}"
                docker-compose -f docker-compose.prod.yml build api
            fi
        fi
    fi
done

# 创建一个包含所有镜像的单一tar文件
echo -e "${YELLOW}正在创建完整的Docker镜像包...${NC}"
docker save "${images[@]}" -o ./docker-images/forum-complete.tar

if [ $? -eq 0 ]; then
    # 计算文件大小
    if command -v du &>/dev/null; then
        file_size=$(du -h ./docker-images/forum-complete.tar | cut -f1)
        size_info="文件大小: ${file_size}"
    else
        size_info=""
    fi
    
    echo -e "${GREEN}所有Docker镜像已成功打包!${NC}"
    echo -e "${CYAN}输出文件: ./docker-images/forum-complete.tar${NC}"
    if [ -n "$size_info" ]; then
        echo -e "${CYAN}${size_info}${NC}"
    fi
    echo -e "\n${YELLOW}使用方法:${NC}"
    echo -e "在目标机器上，运行以下命令加载所有镜像:"
    echo -e "docker load -i forum-complete.tar"
    echo -e "\n然后运行 ./start-forum.sh 启动系统"
else
    echo -e "${RED}打包Docker镜像时出错!${NC}"
fi

# 设置脚本可执行权限
chmod +x pack-all-images.sh
