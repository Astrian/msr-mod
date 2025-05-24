<script lang="ts" setup>
	import { RouterLink } from 'vue-router'
</script>

<template>
	<div class="bg-[#0c1112] w-56 text-white p-4">
		<div>
			<div class="font-semibold text-white/50 text-xs mb-2">音乐库</div>
			<ul class="flex flex-col gap-1">
				<li>
					<RouterLink to="/">
						<div class="text-sm px-2 py-1 hover:bg-white/5 w-full text-left rounded-md">
							<i class="ri-fire-line" />
							<span>浏览</span>
						</div>
					</RouterLink>
				</li>
				<li>
					<RouterLink to="/feelinglucky">
						<div class="text-sm px-2 py-1 hover:bg-white/5 w-full text-left rounded-md">
							<i class="ri-dice-5-line" />
							<span>手气不错</span>
						</div>
					</RouterLink>
				</li>
			</ul>
		</div>
	</div>
</template>