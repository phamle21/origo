export default {
  title: 'Origo のインストール',
  description: '初回起動：データベースのテーブルと最初の管理者アカウントを作成します。',
  token: 'インストールコード',
  tokenHint: 'サーバーに設定した INSTALL_TOKEN の値です。',
  name: '氏名',
  email: 'メールアドレス',
  password: 'パスワード',
  passwordHint: '{min} 文字以上。',
  passwordConfirmation: 'パスワード（確認）',
  submit: 'インストールして管理者を作成',
  submitting: 'インストール中…',
  commandHint: 'コマンドを使う場合：',
  locked:
    'このサーバーではブラウザからのインストールは許可されていません。サーバーに INSTALL_TOKEN を設定するか、API コンテナで次のコマンドを実行してください：',
  unreachable: 'インストール状況を確認するために API に接続できません。API とデータベースが起動しているか確認してください。',
  done: 'Origo のインストールが完了しました。作成した管理者アカウントでサインインしてください。',
};
