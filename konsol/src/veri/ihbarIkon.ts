import type { Icon } from '@phosphor-icons/react'
import {
  Camera,
  ChatText,
  Drop,
  Fire,
  FirstAidKit,
  ForkKnife,
  Package,
  Siren,
  Tent,
  Toilet,
} from '@phosphor-icons/react'
import type { Ihtiyac } from './sorgular'
import type { IhbarTuru } from './ihbar'

/* İhbar türlerinin ve ihtiyaçların simgesi (J-51). Ad ve renk ihbar.ts'te;
   simge burada, çünkü her simge altı çizim ağırlığıyla gelir ve ana parçada
   durmasın (afetzede ekranının ilk açılışı). */

export const IHBAR_IKONU: Record<IhbarTuru | 'sos', Icon> = {
  sos: Siren,
  fotograf: Camera,
  metin: ChatText,
  ihtiyac: Package,
}

export const IHTIYAC_IKONU: Record<Ihtiyac, Icon> = {
  su: Drop,
  gida: ForkKnife,
  barinma: Tent,
  isinma: Fire,
  ilac: FirstAidKit,
  tuvalet: Toilet,
}
