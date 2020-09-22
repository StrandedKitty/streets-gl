const ctx: Worker = self as any;

ctx.addEventListener('message', event => {
	ctx.postMessage({
		foo: 'bar'
	});
});

export default null;

