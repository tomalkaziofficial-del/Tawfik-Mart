export default function WhatsAppButton() {
  return (
    <a 
      href="https://wa.me/8801632331534" 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-green-500 text-white w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-2xl hover:bg-green-600 transition z-50 animate-bounce"
    >
      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-8 h-8" />
    </a>
  );
}