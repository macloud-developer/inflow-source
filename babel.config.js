module.exports = {
  presets: [
    ['@babel/preset-typescript'],
    [
      '@babel/preset-env', {
      'corejs': 2,
      'useBuiltIns': 'usage',
      'modules': false,
    },
    ],
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env', {'targets': {'node': 'current'}},
        ],
      ],
    },
  },
};
