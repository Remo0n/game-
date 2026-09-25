# Revenue plan

Start with a free game and a one-time cosmetic bundle. Bento Blocks' strongest
paid feature is personalizing the food, tray, and scene. Keep the campaign,
daily puzzle, undo, and ordinary earned cosmetics accessible without payment.
This is a product recommendation to test, not evidence of guaranteed revenue.

## First offer

| Offer | Initial price experiment (USD) | Contents |
| --- | --- | --- |
| Deluxe Picnic bundle | $4.99 once | Three new coordinated themes, each with food art, a tray, and a background |
| Later individual theme packs | $1.99–$2.99 once | One new matching set with previews of every included item |
| Optional rewarded ads, after retention testing | No purchase | One clearly described tool reward, requested by the player |

These are proposed products, not existing purchasable items. Final prices should
come from the store in the player's currency. Retain already earned/owned
designs. Do not promise every future pack in the starter bundle. Show the offer
inside Collection after players have tried several levels; avoid launch popups.

Do not begin with a subscription: the current game has no proven stream of paid
content or service that justifies recurring billing. Apple requires ongoing
value for auto-renewing subscriptions. [App Review Guidelines, 3.1.2](https://developer.apple.com/app-store/review/guidelines/#subscriptions)

## Optional ad experiment

Use one player-initiated placement in Tools, such as “Watch an ad for one extra
cut.” Explain the reward before opening the ad, pause the game, and grant it
once only after the reward callback. Skipping, no fill, or an ad failure must
return to normal play without spending anything. Keep the current free tool
sources; do not make puzzles harder to sell help.

Do not use banners over the board, ads during cutting/dragging, or forced ads
between every level. Google Play restricts disruptive placements, including
unexpected ads during gameplay and at the beginning of levels.
[Google Play ads policy](https://support.google.com/googleplay/android-developer/answer/9857753?hl=en)

AdMob describes rewarded ads as a player-selected exchange and recommends a
clear reward prompt. Its policy requires affirmative opt-in for ordinary
rewarded ads, delivery of the promised reward, and uninterrupted normal use when
the player declines. [AdMob playbook](https://admob.google.com/home/resources/rewarded-ads-playbook/)
· [Rewarded-ad requirements](https://support.google.com/admob/answer/7313578?hl=en)

Begin with a small frequency cap, for example three optional rewards per day,
as an experiment. Do not sell “remove ads” while the game has no forced ads.
If players dislike ads or few choose them, retain cosmetics as the main model.

## Implementation sequence

1. Validate the experience with a small external test group. Measure first-level
   completion, level abandonment, return visits on days 1 and 7, session length,
   and interest in Collection. Choose analytics deliberately and update the
   privacy disclosures before collecting data.
2. Ship one new paid bundle with native in-app purchases, localized prices,
   verified ownership, purchase cancellation/pending/refund handling, and Restore
   Purchases. Test reinstall and account changes. A local save flag alone is not
   a reliable purchase entitlement.
3. Keep web free initially. Selling persistent web ownership requires checkout,
   receipt verification, and a way to recover purchases. Cross-platform ownership
   additionally requires an account/entitlement design; it does not come from the
   current device-local saves.
4. Compare purchase conversion and revenue per active player with retention and
   refunds before adding more offers. Test rewarded ads separately so their effect
   is measurable. Configure consent, age suitability, SDK disclosures, and any
   tracking permission for the actual shipped integration.
5. Add more art packs only if players buy and continue playing. Consider paid
   acquisition only after observed net lifetime revenue exceeds acquisition cost
   with room for uncertainty and ongoing costs.

Apple's and Google's standard rules use their billing systems for native digital
goods, with region/program-specific exceptions. Native store billing is the
simplest initial implementation for this game; recheck the rules for the chosen
storefronts when implementing. [Apple purchase rules](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase)
· [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en)

## Revenue math

Estimate purchases from **active players × payer conversion × average spend**,
then subtract store/payment fees, refunds, taxes where applicable, and costs.
For illustration only, 10,000 monthly active players × 2% buying a $4.99 bundle
is $998 gross, not profit. Those inputs are assumptions, not benchmarks or a
forecast. The same players will not buy the same non-consumable bundle again
every month, so acquisition and repeat purchases of genuinely new packs matter.

For ads, use **actual rewarded impressions ÷ 1,000 × observed eCPM**. Geography,
consent, platform, fill, and demand affect that rate; do not build the business
plan around a generic eCPM screenshot.

Eligible developers enrolled in Apple's Small Business Program receive a 15%
commission rate under its terms; do not assume eligibility or the same fee on
every platform. [Apple Small Business Program](https://developer.apple.com/app-store/small-business-program/)

No payment processor, ad SDK, analytics collection, or paid offer was enabled in
this review. The game continues to work with its existing local progress system.
