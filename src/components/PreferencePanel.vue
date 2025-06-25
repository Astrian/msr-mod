<script lang="ts" setup>

import XIcon from '../assets/icons/x.vue'
import { usePreferences } from '../stores/usePreferences'
import { computed } from 'vue'
import { cicdInfo } from '../utils'

const preferences = usePreferences()

defineProps<{
	present: boolean
}>()

defineEmits<{
	(e: 'dismiss'): void
}>()

const version = computed(() => {
	try {
		// 如果你的构建工具支持，可以直接导入
		return chrome?.runtime?.getManifest?.()?.version || 'unknown'
	} catch (error) {
		return 'unknown'
	}
})
</script>

<template>
	<Transition name="modal">
		<div v-if="present"
			class="bg-black/30 w-screen h-screen absolute top-0 left-0 z-30 flex justify-center items-center select-none"
			@click="$emit('dismiss')">
			<div
				class="bg-neutral-900/80 shadow-[0_0_16px_0_rgba(0,0,0,0.5)] backdrop-blur-2xl border border-[#ffffff39] rounded-lg w-[60rem] h-3/4 relative overflow-y-auto modal-content"
				@click.stop>
				<div
					class="flex justify-between items-center p-8 sticky top-0 bg-gradient-to-b from-neutral-900 to-neutral-900/0 z-10">
					<div class="text-white text-2xl font-semibold">偏好设置</div>
					<button
						class="text-white w-9 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center transition-all duration-200 hover:bg-neutral-700/80"
						@click="$emit('dismiss')">
						<XIcon :size="4" />
					</button>
				</div>

				<div class="flex flex-col gap-4 mb-8">
					<div>
						<div class="px-8">
							<div class="text-white/50 text-sm ml-6">播放间</div>
							<ul class="border border-[#ffffff39] rounded-lg backdrop-blur-lg mt-2 overflow-hidden">
								<li class="odd:bg-neutral-300/5">
									<button
										class="flex justify-between items-center px-6 py-4 w-full text-left hover:bg-neutral-300/10 transition-all"
										@click="preferences.displayTimeLeft = !preferences.displayTimeLeft">
										<div class="flex flex-col">
											<div class="text-base text-white">播放进度条右侧显示剩余时间</div>
											<div class="text-sm text-white/80">而非歌曲总时长</div>
										</div>

										<div>
											<div class="text-sky-500 text-lg" v-if="preferences.displayTimeLeft">开启</div>
											<div class="text-neutral-500 text-lg" v-else>关闭</div>
										</div>
									</button>
								</li>
								<li class="odd:bg-neutral-300/5">
									<button
										class="flex justify-between items-center px-6 py-4 w-full text-left hover:bg-neutral-300/10 transition-all"
										@click="preferences.presentLyrics = !preferences.presentLyrics">
										<div class="flex flex-col">
											<div class="text-base text-white">显示滚动歌词文本</div>
											<div class="text-sm text-white/80">当歌词文本可用时</div>
										</div>

										<div>
											<div class="text-sky-500 text-lg" v-if="preferences.presentLyrics">开启</div>
											<div class="text-neutral-500 text-lg" v-else>关闭</div>
										</div>
									</button>
								</li>

							</ul>
						</div>
					</div>

					<div>
						<div class="px-8">
							<div class="text-white/50 text-sm ml-6">行为</div>
							<ul class="border border-[#ffffff39] rounded-lg backdrop-blur-lg mt-2 overflow-hidden">
								<li class="odd:bg-neutral-300/5">
									<button
										class="flex justify-between items-center px-6 py-4 w-full text-left hover:bg-neutral-300/10 transition-all"
										@click="preferences.autoRedirect = !preferences.autoRedirect">
										<div class="flex flex-col">
											<div class="text-base text-white">自动重定向</div>
											<div class="text-sm text-white/80">当尝试访问塞壬唱片官网时，重定向到 MSR Mod</div>
										</div>

										<div>
											<div class="text-sky-500 text-lg" v-if="preferences.autoRedirect">开启</div>
											<div class="text-neutral-500 text-lg" v-else>关闭</div>
										</div>
									</button>
								</li>
							</ul>
							<div class="text-white/50 text-sm mx-6 mt-2">即使此项目关闭，随时都可以通过点按 MSR Mod 扩展图标启动 MSR Mod。</div>
						</div>
					</div>

					<div>
						<div class="px-8">
							<div class="text-white/50 text-sm ml-6">关于</div>
							<ul class="border border-[#ffffff39] rounded-lg backdrop-blur-lg mt-2 overflow-hidden">
								<li class="odd:bg-neutral-300/5">
									<div
										class="flex justify-between items-center px-6 py-4 w-full text-left hover:bg-neutral-300/10 transition-all">
										<div class="flex flex-col">
											<div class="text-base text-white">MSR Mod</div>
											<div class="text-sm text-white/80">版本号 {{ version }}</div>
										</div>
									</div>
								</li>

								<li class="odd:bg-neutral-300/5">
									<a href="https://github.com/astrian/msr-mod" target="_blank"
										class="flex justify-between items-center px-6 py-4 w-full text-left hover:bg-neutral-300/10 transition-all">
										<div class="flex flex-col">
											<div class="text-base text-white">前往 GitHub 仓库</div>
											<div class="text-sm text-white/80">在 Issue 中提交问题或建议，或者，修 Bug 的事情就拜托了，大佬桑！（鞠躬）</div>
										</div>
									</a>
								</li>

								<li class="odd:bg-neutral-300/5">
									<a href="https://discord.gg/QQUfeb2gzH" target="_blank"
										class="flex justify-between items-center px-6 py-4 w-full text-left hover:bg-neutral-300/10 transition-all">
										<div class="flex flex-col">
											<div class="text-base text-white">前往 Discord 社群</div>
											<div class="text-sm text-white/80">在社群中提交问题或建议，或是来聊聊《明日方舟》的音乐吧！</div>
										</div>
									</a>
								</li>

								<li class="odd:bg-neutral-300/5">
									<a href="https://trello.com/b/Ju1TRXla" target="_blank"
										class="flex justify-between items-center px-6 py-4 w-full text-left hover:bg-neutral-300/10 transition-all">
										<div class="flex flex-col">
											<div class="text-base text-white">前往 Trello 看板</div>
											<div class="text-sm text-white/80">了解 MSR Mod 目前的开发进度。</div>
										</div>
									</a>
								</li>
							</ul>
						</div>
					</div>

					<div>
						<div class="px-8">
							<div class="text-white/50 text-sm ml-6">构建信息</div>
							<ul class="border border-[#ffffff39] rounded-lg backdrop-blur-lg mt-2 overflow-hidden">
								<li class="odd:bg-neutral-300/5">
									<a :href="`https://git.nas.astrian.moe/Astrian/msr-mod/actions/runs/${cicdInfo.runId}`"
										target="_blank">
										<div
											class="flex justify-between items-center px-6 py-4 w-full text-left hover:bg-neutral-300/10 transition-all">
											<div class="flex flex-col">
												<div class="text-base text-white">Gitea Actions 运行编号</div>
												<div class="text-sm text-white/80">{{ cicdInfo.runId }}</div>
											</div>
										</div>
									</a>
								</li>

								<li class="odd:bg-neutral-300/5">
									<div
										class="flex justify-between items-center px-6 py-4 w-full text-left hover:bg-neutral-300/10 transition-all">
										<div class="flex flex-col">
											<div class="text-base text-white">触发构建的提交哈希</div>
											<div class="text-sm text-white/80">{{ cicdInfo.hashId }}</div>
										</div>
									</div>
								</li>
							</ul>
							<div class="text-white/50 text-sm mx-6 mt-2">MSR Mod 通过 Gitea Actions 自动化完成构建与发布流程。此信息用于验证当前版本的构建来源，确保代码完整性与安全性。</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
	opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
	opacity: 0;
	transform: scale(0.95) translateY(1rem);
}
</style>