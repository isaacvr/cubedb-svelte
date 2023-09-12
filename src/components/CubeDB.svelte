<script lang="ts">
  // @ts-ignore
  import QRCode from 'qrcode';
  import { version } from '@stores/version.store';
  import Button from './material/Button.svelte';
  import GithubIcon from '@icons/Github.svelte';
  import InstagramIcon from '@icons/Instagram.svelte';
  import GmailIcon from '@icons/Gmail.svelte';
  
  // @ts-ignore
  import TelegramIcon from '@icons/Telegram.svelte';
  import CopyIcon from '@icons/ContentCopy.svelte';
  import { copyToClipboard } from '@helpers/strings';
  import { NotificationService } from '@stores/notification.service';
  import { derived, type Readable } from 'svelte/store';
  import type { Language } from '@interfaces';
  import { globalLang } from '@stores/language.service';
  import { getLanguage } from '@lang/index';
  import { DataService } from '@stores/data.service';

  let localLang: Readable<Language> = derived(globalLang, ($lang, set) => {
    set( getLanguage( $lang ) );
  });

  const notification = NotificationService.getInstance();
  const dataService = DataService.getInstance();

  interface Donation {
    logo: string;
    qr: string;
    qrText: string;
    address: string;
    currency: string;
    cubaOnly: boolean;
  }

  const donations: Donation[] = [
    {
      logo: '/assets/transfermovil.png',
      address: '9227-0699-9291-8501',
      qr: '',
      qrText: 'TRANSFERMOVIL_ETECSA,TRANSFERENCIA,9227069992918501,55070597,',
      cubaOnly: true,
      currency: 'CUP'
    },
    {
      logo: '/assets/transfermovil.png',
      address: '9225-1299-7655-0563',
      qr: '',
      qrText: 'TRANSFERMOVIL_ETECSA,TRANSFERENCIA,9225129976550563,55070597,',
      cubaOnly: true,
      currency: 'MLC'
    },
    {
      logo: '/assets/ETH.png',
      address: '0x3C40129375a2EC230B59fBa89C95058321241313',
      qr: '',
      qrText: 'ethereum:0x3C40129375a2EC230B59fBa89C95058321241313@1',
      cubaOnly: false,
      currency: 'ETH + Tokens'
    },
    {
      logo: '/assets/BTC.png',
      address: 'bc1qcsr4v5yf8m9cfax5rrurjssy4fw5jrgzqpvfnd',
      qr: '',
      qrText: 'bc1qcsr4v5yf8m9cfax5rrurjssy4fw5jrgzqpvfnd',
      cubaOnly: false,
      currency: 'BTC'
    },
  ];

  (async () => {
    for (let i = 0, maxi = donations.length; i < maxi; i += 1) {
      donations[i].qr = await QRCode.toDataURL( donations[i].qrText );
    }
  })();

  function to(url: string) {
    dataService.openURL(url);
  }

  function toClipboard(s: string) {
    copyToClipboard(s).then(() => {
      notification.addNotification({
        key: crypto.randomUUID(),
        header: $localLang.global.done,
        text: $localLang.global.copiedToClipboard,
        timeout: 1000
      });
    });
  }
</script>

<main class="container-mini text-gray-400 bg-white bg-opacity-10 m-4 p-4
  rounded-md flex flex-col items-center gap-2 mb-20">

  <!-- Logo -->
  <section>
    <img src="/assets/logo-500.png" alt="" class="puzzle-img">
  </section>

  <hr>

  <!-- Name -->
  <section>
    <span class="key bg-purple-700">{ $localLang.CUBEDB.name }: </span>
    <span class="value">CubeDB</span>
  </section>
  
  <hr>

  <!-- Version -->
  <section>
    <span class="key bg-pink-700">{ $localLang.CUBEDB.version }: </span>
    <span class="value">{ $version }</span>
  </section>
  
  <hr>

  <!-- Creator -->
  <section>
    <span class="key bg-green-700">{ $localLang.CUBEDB.creator }: </span>
    <span class="value">Isaac Vega Rodríguez</span>
  </section>
  
  <hr>

  <!-- RRSS -->
  <section>
    <Button class="bg-gray-600 text-gray-300 gap-2"
      on:click={ () => to('https://github.com/isaacvr/cubedb-svelte') }
    > <GithubIcon size="1.2rem"/> GitHub</Button>

    <Button class="bg-pink-600 text-gray-300 gap-2"
      on:click={ () => to('https://instagram.com/isaacvr96') }
    > <InstagramIcon size="1.2rem"/> Instagram</Button>
    
    <Button class="bg-blue-600 text-gray-300 gap-2"
      on:click={ () => to('mailto:isaacvega1996@gmail.com') }
    > <GmailIcon size="1.2rem"/> Gmail</Button>
    
    <Button class="bg-blue-800 text-gray-300 gap-2"
      on:click={ () => to('https://t.me/isaacvr') }
    > <TelegramIcon size="1.2rem"/> Telegram</Button>
  </section>
  
  <hr>

  <!-- Donations -->
  <section class="flex-col w-full">
    <h2 class="text-2xl text-gray-300 mb-6">{ $localLang.CUBEDB.donations }</h2>

    <ul class="donation-container">
      {#each donations as dnt}
        <li class="donation">
          <img src={ dnt.logo } alt="" class="donation-img">
          <img src={ dnt.qr } alt="" class="donation-QR">
          <span class="donation-address" on:click={ () => toClipboard(dnt.address) }><span>{ dnt.address }</span> <CopyIcon size="1.2rem"/> </span>
          <span class="donation-currency flex items-center gap-2">
            {#if dnt.cubaOnly}
              <img src="/assets/cuba.png" alt="" class="w-5 h-4"/>
            {/if}
            
            { dnt.currency }
          </span>
        </li>
      {/each}
    </ul>
  </section>
</main>

<style lang="postcss">
  hr {
    @apply border border-gray-500 w-full;
  }

  section {
    @apply flex items-center gap-4;
  }

  .key {
    @apply p-2 rounded-md text-gray-300;
  }

  .value {
    @apply text-gray-300;
  }

  .donation-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    place-items: center;
    gap: 1rem;
    width: 100%;
  }

  .donation {
    @apply grid place-items-center relative bg-black bg-opacity-30 p-4 rounded-md shadow-lg;
  }

  .donation .donation-img {
    @apply w-12 h-12 rounded-full object-contain shadow-md absolute top-0 left-1/2 -translate-x-[50%] -translate-y-[50%];
  }
  
  .donation .donation-QR {
    @apply rounded-md mt-4;
  }
  
  .donation .donation-address {
    @apply flex py-1 items-center gap-2 cursor-pointer hover:text-pink-400;
  }
  
  .donation .donation-address span {
    max-width: 19ch;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  
  .donation .donation-currency {
    color: inherit;
  }
</style>