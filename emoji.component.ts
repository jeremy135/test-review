import {AfterContentInit, Component, OnInit} from '@angular/core';
import {EmojiGitHubService} from "../services/emojiGitHub.service";
import {Emoji} from "../emoji";
import {ActivatedRoute} from "@angular/router";
import {LocalStorageDataService} from "../services/localStorageData.service";
import {EmojiItemsPage} from "../emojIItemsPage";


@Component({
    selector: 'app-emoji-items',
    templateUrl: './emoji-items.component.html',
    styleUrls: ['./emoji-items.component.css']
})
export class EmojiItemsComponent implements OnInit {

    emoji: Array<Emoji> = []; // массив с emoji
    emojiAll: Array<Emoji> = []; // массив всех emoji определенной выборки (all, favorite, deleted)
    emojiPage: EmojiItemsPage; // объект EmojiItemsPage c массиом emoji страницы пагинации и общим кол-ом emoji определенной выборки (all, favorite, deleted)
    emojiSize: number; // кол-во emoji во всей выборке
    emojiPerPage: number; // кол-во emoji на странице
    pageTitle: string;
    pageName: string;
    pageNumber: number;

    constructor(private getEmojiService: EmojiGitHubService,
                private getLocalStorageDataService: LocalStorageDataService,
                private route: ActivatedRoute) {
        this.pageTitle = route.snapshot.data['title'];
        this.pageName = route.snapshot.routeConfig.path;
        this.pageNumber = 1;
        this.emojiPerPage = 14;
        this.setInitialEmoji();
    }

    ngOnInit() {
    }


    public onPageChange() {
        this.loadPage();
    }


    // метод, который инициализирует emoji при запуске приложения
    public setInitialEmoji(): void {
        // если LocalStorage пуст, то забираем emoji с гитхаба, иначе из LocalStorage
        if (!this.getLocalStorageDataService.islLocalStorage()) {
            console.log('Get data from Github');
            this.getEmojiService.getData().subscribe(dataFromHttp => {
                    this.emojiAll = this.compileEmoji(dataFromHttp);
                    this.getLocalStorageDataService.updateLocalStorage(this.emojiAll);
                    this.loadPage();
                }
            );
        } else {
            console.log('Get data from LocalStorage');
            this.emojiAll = this.getActiveEmoji();
            this.loadPage();
        }
    }

    // Подтягиваем emoji в соответствии со страницей
    public loadPage() {
        switch (this.pageName) {
            case '': // Если главная
                this.emojiPage = this.getEmojiPage(this.getActiveEmoji(), this.pageNumber, this.emojiPerPage);
                break;
            case 'favorite': // Если любимые
                this.emojiPage = this.getEmojiPage(this.getFavoriteEmoji(), this.pageNumber, this.emojiPerPage);
                break;
            case 'deleted': // Если удаленные
                this.emojiPage = this.getEmojiPage(this.getDeletedEmoji(), this.pageNumber, this.emojiPerPage);
                break;
            default:
                this.emojiPage = this.getEmojiPage(this.getActiveEmoji(), this.pageNumber, this.emojiPerPage);
        }
        this.emoji = this.emojiPage.emoji;
        this.emojiSize = this.emojiPage.totalCount;
    }

    // Метод, который собирает emoji, и возвращает готовый массив объектов emoji
    private compileEmoji(data: Object): Array<Emoji> {
        let index = 0;
        for (let key in data) {
            this.emoji.push({
                id: index,
                name: key,
                link: data[key],
                favorite: false,
                deleted: false
            });
            index++;
        }
        return this.emoji;
    }

    // метод, который возвращает все emoji, кроме удаленных
    private getActiveEmoji(): Array<Emoji> {
        return this.getLocalStorageDataService.getLocalStorage().filter(
            emoji => emoji.deleted === false);
    }

    // методы, которые возвращает удаленные / любимые emoji, если LocalStorage не пуст,
    // иначе возвращает всю выборку emoji с гитхаба
    private getDeletedEmoji(): Array<Emoji> {
        return this.getLocalStorageDataService.islLocalStorage() ?
            this.getLocalStorageDataService.getLocalStorage()
                .filter(emoji => emoji.deleted === true) :
            this.getActiveEmoji();
    }

    private getFavoriteEmoji(): Array<Emoji> {
        return this.getLocalStorageDataService.islLocalStorage() ?
            this.getLocalStorageDataService.getLocalStorage()
                .filter(emoji => emoji.favorite === true) :
            this.getActiveEmoji();
    }


    // метод для поиска emoji
    public emojiSearch(event): void {
        let name = event.target.value;
        if (name !== '') {
            this.emoji = this.emojiAll.filter(emoji => emoji.name === name);
            this.emojiSize = this.emoji.length;
        } else {
            this.emoji = this.emojiPage.emoji;
            this.emojiSize = this.emojiPage.totalCount;
        }
    }

    // метод, который возвращает объект EmojiItemsPage
    // c массиом emoji страницы пагинации
    // и общим кол-ом emoji определенной выборки (all, favorite, deleted)
    // Сделан для оптимизации - чтобы не отрисовывать 1500 emoji в доме на главной странице
    private getEmojiPage(emoji: Array<Emoji>, page: number, itemsPerPage: number): EmojiItemsPage {
        let startIndex = itemsPerPage * (page - 1);
        this.emojiAll = emoji;
        return new EmojiItemsPage(emoji.length, emoji.slice(startIndex, startIndex + itemsPerPage));
    }
}
