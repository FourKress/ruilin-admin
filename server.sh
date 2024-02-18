#!/bin/bash

echo '---开始执行git checkout main---'
git checkout main
echo '---开始执行git pull---'
git pull
echo '---git pull执行完毕，pnpm install---'
pnpm i
echo '---pnpm install执行完毕，开始执行pnpm build---'
pnpm build
echo '---pnpm build执行完毕 服务启动成功---'
