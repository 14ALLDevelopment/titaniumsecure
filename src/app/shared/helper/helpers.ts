import {Injectable} from '@angular/core';
import * as moment from 'moment';

@Injectable()
export class Helpers {

  static parseTime(timeString: string) {
    const time = new Date(timeString).getTime();
    return moment(time).fromNow();
  }

  static getimeDifference (date1,now){
    let date;
    if(date1 instanceof Date){date = date1;}
    else{
      let timestampLenght = Math.round(date1).toString().length;
      //console.log("number", timestampLenght, date1)
      if(timestampLenght >= 13){
        date1 = date1 / 1000;  //converting into seconds.
      }
      date = moment.unix(date1).local().toDate();
    }
    return ( moment(now).diff(moment(date), "seconds") )
  }

  static scrollTo(elem, position) {
    const
      elemHeight = elem.offsetHeight,
      elemScrollHeight = elem.scrollHeight;

    if (position === 'bottom') {
      if ((elemScrollHeight - elemHeight) > 0) {
        elem.scrollTop = elemScrollHeight;
      }
    } else if (position === 'top') {
      elem.scrollTop = 10;
    } else if (+position) {
      elem.scrollTop = +position;
    }
  }


  static filterCommonContacts(array1, array2){
    let filteredArray= []
    filteredArray = array1.filter(o1 => !array2.some(o2 => o1.phone === o2.user.phone)); 
    return filteredArray;
  }

  static getUniqueArray(arr){
    return [...new Map(arr.map(v => [v.user.id, v])).values()]
  }

  static getUniqueContactsArr(arr){
    return [...new Map(arr.map(v => [v.phone, v])).values()]
  }

  static groupedAlphabeticallyContacts(contacts){
    const sorted = contacts.sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);

    const grouped = sorted.reduce((groups, contact) => {
        const letter = contact.name.toUpperCase().charAt(0);

        groups[letter] = groups[letter] || [];
        groups[letter].push(contact);

        return groups;
    }, {});

    const result = Object.keys(grouped).map(key => ({key, contacts: grouped[key]}));

    return result;
  }


}
