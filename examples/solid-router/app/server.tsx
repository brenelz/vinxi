/// <reference types="vinxi/server" />
import { MetaProvider, renderTags } from "@solidjs/meta";
import { Router, Routes } from "@solidjs/router";
import {
	HydrationScript,
	NoHydration,
	Suspense,
	renderToStringAsync,
	ssr,
	useAssets,
} from "solid-js/web";
import fileRoutes from "vinxi/routes";
import { eventHandler } from "vinxi/runtime/server";

import { join } from "node:path";

import App from "./app";
import lazyRoute from "./lazy-route";
import { renderAsset } from "./render-asset";

export default eventHandler(async (event) => {
	const events = {};

	const clientManifest = import.meta.env.MANIFEST["client"];
	const serverManifest = import.meta.env.MANIFEST["ssr"];

	const assets = await clientManifest.inputs["./app/client.tsx"].assets();

	const FileRoutes = () => {
		return routes;
	};

	const routes = fileRoutes.map((route) => {
		return {
			...route,
			component: lazyRoute(route.component, clientManifest, serverManifest),
		};
	});
	const tags = [];
	function Meta() {
		useAssets(() => ssr(renderTags(tags)) as any);
		return null;
	}

	const manifestJson = await clientManifest.json();
	const html = await renderToStringAsync(() => (
		<MetaProvider tags={tags}>
			<Router
				out={{}}
				url={join(import.meta.env.BASE_URL, event.path)}
				base={import.meta.env.BASE_URL}
			>
				<App
					assets={
						<>
							<NoHydration>
								<Meta />
							</NoHydration>
							<Suspense>{assets.map((m) => renderAsset(m))}</Suspense>
						</>
					}
					scripts={
						<>
							<NoHydration>
								<HydrationScript />
								<script
									innerHTML={`window.manifest = ${JSON.stringify(
										manifestJson,
									)}`}
								></script>
								<script
									type="module"
									src={clientManifest.inputs["./app/client.tsx"].output.path}
								/>
							</NoHydration>
						</>
					}
				>
					<Suspense>
						<Routes>
							<FileRoutes />
						</Routes>
					</Suspense>
				</App>
			</Router>
		</MetaProvider>
	));
	return html;
	// const stream = renderToPipeableStream(
	// 	<App assets={<Suspense>{assets.map((m) => renderAsset(m))}</Suspense>} />,
	// 	{
	// 		onAllReady: () => {
	// 			events["end"]?.();
	// 		},
	// 		bootstrapModules: [clientManifest.inputs["./app/client.tsx"].output.path],
	// 		bootstrapScriptContent: `window.manifest = ${JSON.stringify(
	// 			await clientManifest.json(),
	// 		)}`,
	// 	},
	// );

	// // @ts-ignore
	// stream.on = (event, listener) => {
	// 	events[event] = listener;
	// };

	// return stream;
});