// Firebase 프로젝트 설정값 (Firebase 콘솔 → 프로젝트 설정 → 내 앱 → 가계부 웹앱).
// 이 값들은 공개돼도 괜찮다. 데이터는 Firestore 보안 규칙으로 내 구글 계정만 읽고 쓸 수 있게 막는다.
export const firebaseConfig = {
  apiKey: 'AIzaSyDv3bmpeAeVIgiTavuXwrLy_J6FeyD4-K8',
  authDomain: 'gagyebu-heejae.firebaseapp.com',
  projectId: 'gagyebu-heejae',
  appId: '1:778193286823:web:662e9b0bec9e6a5b090d82',
};

export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
