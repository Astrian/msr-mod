<script lang="ts" setup>
import XIcon from '../assets/icons/x.vue'
import { computed } from 'vue'

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
	<div class="absolute top-0 left-0 w-screen h-screen bg-neutral-700/30 flex justify-center items-center">
		<div class="bg-neutral-900/80 shadow-[0_0_16px_0_rgba(0,0,0,0.5)] backdrop-blur-2xl border border-[#ffffff39] rounded-lg w-[60rem] h-3/4 relative overflow-y-auto text-white">
			<div
				class="flex justify-between items-center p-8 sticky top-0 bg-gradient-to-b from-neutral-900 to-neutral-900/0 z-10">
				<div class="text-white text-2xl font-semibold">MSR Mod 已更新至 {{version}}</div>
				<button
					class="text-white w-9 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center transition-all duration-200 hover:bg-neutral-700/80"
					@click="$emit('dismiss')">
					<XIcon :size="4" />
				</button>
			</div>

			<div class="flex flex-col gap-4 mb-8 px-8 text-lg">
				<p>MSR Mod 现在有两种渠道接收错误及意见反馈。如果你对 MSR Mod 有任何的意见建议，或是想要回报错误及体验困惑之处，欢迎前往 <a href="https://github.com/Astrian/msr-mod/issues" target="_blank" class="underline">GitHub Issue</a> 或 <a href="https://discord.gg/QQUfeb2gzH" target="_blank" class="underline">Discord 社群</a> 向我们反馈。如果你的意见或错误回报被接受，我们会将其放入 <a href="https://trello.com/b/Ju1TRXla" target="_blank" class="underline">Trello 看板</a> 中进行跟踪，敬请留意。</p>

				<ul class="list-disc list-inside">
					<li>新增版本更新提示对话框，将在 MSR Mod 更新后首次启动显示。</li>
				</ul>
			</div>
		</div>
	</div>
</template>
