import React, { useCallback, useEffect, useState } from 'react';
import { Container, Header, UserInfo, Photo, User, UserGreeting, UserName,UserWrapper, Icon,HighlightCards,Transactions,Title, TransactionList,LogoutButton, LoadContainer} from './styles';
import { HighlightCard } from '../../components/HighlightCard';
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native';
import theme from '../../global/styles/theme';
import { useAuth } from '../../hooks/auth';

interface HighlightData {
  amount: string;
  lastTransaction: string;
}

interface HighlightDataProps {
  entries: HighlightData;
  expensives: HighlightData;
  total: HighlightData;
}

export interface DataListProps extends TransactionCardProps {
  id: string;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<DataListProps[]>([]);
  const [highlightData,setHighlightData] = useState<HighlightDataProps>({} as HighlightDataProps);
  
  const {signOut,user} = useAuth();

  const dataKey = `@gofinances:transactions_user:${user.id}`;

  function getLastTransactionDate(collection: DataListProps[], type: 'positive' | 'negative'){

    const collectionFiltered = collection.filter(transaction=> transaction.type === type);

    if(collectionFiltered.length === 0) 
      return 0 

    const lastTransaction = new Date(Math.max.apply(Math,collection
      .filter(transaction=> transaction.type === type)
      .map(transaction=> new Date(transaction.date).getTime())
    )); 

    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR',{month: 'long'})}`;

  }

  async function loadTransaction(){
    const response = await AsyncStorage.getItem(dataKey);
    const transactions = response ? JSON.parse(response) : [];

    let entriesTotal = 0;
    let expensiveTotal = 0;

    const transactionsFormatted: DataListProps[] = transactions.map((item:DataListProps) =>{
      if(item.type === 'positive'){
        entriesTotal += Number(item.amount);
      }
      else{
        expensiveTotal += Number(item.amount);
      }

      const amount = Number(item.amount).toLocaleString('pt-BR',{
        style: 'currency',
        currency: 'BRL'
      });

      const date = Intl.DateTimeFormat('pt-BR',{
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).format(new Date(item.date));

      return {
        id: item.id,
        name: item.name,
        amount,
        type: item.type,
        category: item.category, 
        date,
      }

    });
    setTransactions(transactionsFormatted);

    const lastTransactionEntries = getLastTransactionDate(transactions, 'positive');
    const lastTransactionExpensives = getLastTransactionDate(transactions, 'negative');
    const totalInterval = `01 a ${lastTransactionExpensives}`

    const total = entriesTotal - expensiveTotal;

    setHighlightData({
      entries:{
        amount:entriesTotal.toLocaleString('pt-BR',{
          style: 'currency',
          currency: 'BRL',
        }),
        lastTransaction: lastTransactionEntries === 0 ? 'Não há transações' : `Última entrada dia ${lastTransactionEntries}`,
      },
      expensives:{
        amount: expensiveTotal.toLocaleString('pt-BR',{
          style: 'currency',
          currency: 'BRL',
        }),
        lastTransaction: lastTransactionExpensives === 0 ? 'Não há transações' :`Última saída dia ${lastTransactionExpensives}`,
      },
      total:{
        amount: total.toLocaleString('pt-BR',{
          style: 'currency',
          currency: 'BRL',
        }),
        lastTransaction: total === 0 ? 'Não há transações' :totalInterval,
      }
    });

    setIsLoading(false);
  }

  useEffect(()=>{
    loadTransaction();
  },[]);

  useFocusEffect(useCallback(()=>{loadTransaction()},[]));

  return(
    <Container>
      {
        isLoading ? 
        <LoadContainer>
          <ActivityIndicator color={theme.colors.secondary} size='large'/> 
        </LoadContainer>      
        :
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo source={{uri: user.photo}} />
                <User>
                  <UserGreeting>Olá,</UserGreeting>
                  <UserName>{user.name}</UserName>
                </User>
              </UserInfo>
              <LogoutButton onPress={signOut}>
                <Icon name="power"/>
              </LogoutButton>
            </UserWrapper>
          </Header>

          <HighlightCards 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 24}}
          >
            <HighlightCard
              type= 'up'
              title= "Entradas"
              amount= {highlightData?.entries?.amount}
              lastTransaction= {highlightData?.entries?.lastTransaction}
            />
            <HighlightCard
              type = 'down' 
              title= "Saídas"
              amount= {highlightData?.expensives?.amount}
              lastTransaction= {highlightData?.expensives?.lastTransaction}
            />
            <HighlightCard
              type = 'total'   
              title= "Total"
              amount= {highlightData?.total?.amount}
              lastTransaction= {highlightData?.total?.lastTransaction}
            />
          </HighlightCards>

          <Transactions>
            <Title>
              Listagem
            </Title>
            <TransactionList
              data={transactions}
              keyExtractor = {item => item.id}
              renderItem={({item})=><TransactionCard data={item}/>}
            />
          </Transactions>
        </>
      }
    </Container>
  )
}
