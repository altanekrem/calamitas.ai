import { createAccessSession, deleteAccessSession, isLoginRateLimited, recordLoginAttempt, validateAccessSession } from '@/lib/system-access-store';

const COOKIE_NAME = 'calamitas_system_session';
const VALID_CREDENTIAL_HASH = '626c020103248dc0d1118f00967e59933b94f1677b146b08d56a8849a972c7b0';

function text(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }
function secureAttribute(request: Request) { return new URL(request.url).protocol === 'https:' ? '; Secure' : ''; }

function readCookie(request: Request) {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === COOKIE_NAME) return decodeURIComponent(value.join('='));
  }
  return '';
}

async function credentialsMatch(username: string, password: string) {
  const value = new TextEncoder().encode(`${username}\0${password}`);
  const digest = await crypto.subtle.digest('SHA-256', value);
  const candidate = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return candidate === VALID_CREDENTIAL_HASH;
}

export async function GET(request: Request) {
  try {
    const session = await validateAccessSession(readCookie(request));
    return Response.json(session ? { authenticated: true, ...session } : { authenticated: false }, {
      status: session ? 200 : 401,
      headers: { 'cache-control': 'no-store' },
    });
  } catch {
    return Response.json({ authenticated: false }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const visitorName = text(body.visitorName).slice(0, 80);
    const username = text(body.username).slice(0, 80);
    const password = typeof body.password === 'string' ? body.password : '';
    const validInput = visitorName.length >= 2 && username.length >= 1 && password.length >= 8 && password.length <= 128;
    const userAgent = request.headers.get('user-agent') ?? 'Bilinmeyen cihaz';
    if (await isLoginRateLimited(username, userAgent)) {
      await recordLoginAttempt({ visitorName: visitorName || 'Belirtilmedi', username: username || 'Belirtilmedi', succeeded: false, outcome: 'Başarısız · Geçici sınır', userAgent });
      return Response.json({ message: 'Çok sayıda başarısız giriş denemesi algılandı. Lütfen 15 dakika sonra yeniden deneyin.' }, { status: 429 });
    }

    const succeeded = validInput && await credentialsMatch(username, password);
    if (!succeeded) {
      await recordLoginAttempt({ visitorName: visitorName || 'Belirtilmedi', username: username || 'Belirtilmedi', succeeded: false, outcome: 'Başarısız', userAgent });
      return Response.json({ message: 'Kullanıcı adı veya şifre hatalı. Giriş denemesi kaydedildi.' }, { status: 401 });
    }

    const session = await createAccessSession(visitorName);
    try {
      await recordLoginAttempt({ visitorName, username, succeeded: true, outcome: 'Başarılı', userAgent });
    } catch (error) {
      await deleteAccessSession(session.token);
      throw error;
    }
    return Response.json({ message: 'Giriş başarılı. Proje sistemi açıldı.', visitorName }, {
      status: 201,
      headers: {
        'cache-control': 'no-store',
        'set-cookie': `${COOKIE_NAME}=${encodeURIComponent(session.token)}; Path=/; HttpOnly${secureAttribute(request)}; SameSite=Strict; Max-Age=${session.maxAge}`,
      },
    });
  } catch {
    return Response.json({ message: 'Giriş kaydı oluşturulamadığı için erişim güvenli biçimde durduruldu.' }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    await deleteAccessSession(readCookie(request));
  } catch {
    // The cookie is still expired client-side if database cleanup is temporarily unavailable.
  }
  return Response.json({ message: 'Oturum kapatıldı.' }, {
    headers: {
      'cache-control': 'no-store',
      'set-cookie': `${COOKIE_NAME}=; Path=/; HttpOnly${secureAttribute(request)}; SameSite=Strict; Max-Age=0`,
    },
  });
}
