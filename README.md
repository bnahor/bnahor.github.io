# Portfolio

## Stage motion

The figure on the homepage plays real motion capture from [The 100STYLE Dataset](https://www.ianxmason.com/100style/) by Ian Mason (CC BY 4.0), using the skeleton GLBs from [codepawl/100style-glb](https://huggingface.co/datasets/codepawl/100style-glb). To change the takes, edit the list in `scripts/build-motion.mjs`, download those clips and run:

```sh
npm run motion:build -- <dir-of-downloaded-glbs>
```

That cuts each clip to one looping stride, removes the travel, rebuilds it on neutral body proportions, smooths it and writes `src/components/stage/takes.ts`. Keep the dataset credit in the homepage footer: the licence requires it.
